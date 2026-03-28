import os
from neo4j import GraphDatabase
from app.utils.logger import logger

_driver = None


def get_driver():
    global _driver
    if _driver is None:
        uri = os.getenv("NEO4J_URI", "bolt://neo4j:7687")
        user = os.getenv("NEO4J_USER", "neo4j")
        password = os.getenv("NEO4J_PASSWORD", "")
        try:
            _driver = GraphDatabase.driver(uri, auth=(user, password))
            _driver.verify_connectivity()
            logger.info("Neo4j connected")
        except Exception as e:
            logger.warning(f"Neo4j not available: {e}")
            _driver = None
    return _driver


def sync_dataset(dataset_id: int, filename: str, file_type: str, record_count: int, columns: list[str]):
    """Create/update Dataset node and its Column nodes in Neo4j."""
    driver = get_driver()
    if not driver:
        return
    try:
        with driver.session() as session:
            # Merge dataset node
            session.run(
                """
                MERGE (d:Dataset {id: $id})
                SET d.name = $name, d.file_type = $file_type, d.record_count = $record_count
                """,
                id=dataset_id, name=filename, file_type=file_type, record_count=record_count,
            )
            # Merge each column and create relationship
            for col in columns:
                session.run(
                    """
                    MERGE (c:Column {name: $col})
                    WITH c
                    MATCH (d:Dataset {id: $id})
                    MERGE (d)-[:HAS_COLUMN]->(c)
                    """,
                    col=col, id=dataset_id,
                )
        logger.info(f"Neo4j synced dataset {dataset_id} with {len(columns)} columns")
    except Exception as e:
        logger.warning(f"Neo4j sync failed for dataset {dataset_id}: {e}")


def delete_dataset(dataset_id: int):
    """Remove Dataset node and orphan Column nodes from Neo4j."""
    driver = get_driver()
    if not driver:
        return
    try:
        with driver.session() as session:
            # Delete dataset and its relationships
            session.run(
                "MATCH (d:Dataset {id: $id}) DETACH DELETE d",
                id=dataset_id,
            )
            # Clean up orphan columns (not connected to any dataset)
            session.run(
                "MATCH (c:Column) WHERE NOT (c)<-[:HAS_COLUMN]-() DELETE c"
            )
        logger.info(f"Neo4j removed dataset {dataset_id}")
    except Exception as e:
        logger.warning(f"Neo4j delete failed for dataset {dataset_id}: {e}")


def get_graph() -> dict:
    """Return all nodes and relationships for visualization."""
    driver = get_driver()
    if not driver:
        return {"nodes": [], "links": [], "available": False}

    try:
        with driver.session() as session:
            # Get all dataset nodes
            datasets = session.run(
                "MATCH (d:Dataset) RETURN d.id AS id, d.name AS name, d.file_type AS file_type, d.record_count AS record_count"
            ).data()

            # Get all column nodes with dataset count
            columns = session.run(
                """
                MATCH (c:Column)<-[:HAS_COLUMN]-(d:Dataset)
                RETURN c.name AS name, count(d) AS dataset_count
                """
            ).data()

            # Get all relationships
            links = session.run(
                "MATCH (d:Dataset)-[:HAS_COLUMN]->(c:Column) RETURN d.id AS dataset_id, c.name AS col_name"
            ).data()

        nodes = []
        for d in datasets:
            nodes.append({
                "id": f"d_{d['id']}",
                "label": d["name"],
                "type": "dataset",
                "file_type": d.get("file_type", ""),
                "record_count": d.get("record_count", 0),
                "dataset_count": None,
            })
        for c in columns:
            nodes.append({
                "id": f"c_{c['name']}",
                "label": c["name"],
                "type": "column",
                "file_type": None,
                "record_count": None,
                "dataset_count": c.get("dataset_count", 1),
            })

        edges = [
            {"source": f"d_{l['dataset_id']}", "target": f"c_{l['col_name']}"}
            for l in links
        ]

        return {"nodes": nodes, "links": edges, "available": True}

    except Exception as e:
        logger.warning(f"Neo4j get_graph failed: {e}")
        return {"nodes": [], "links": [], "available": False}
