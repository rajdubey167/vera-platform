import csv, json, random, math
from datetime import datetime, timedelta

random.seed(42)

# ── 1. E-commerce Transactions (600 rows) ─────────────────────────────────────
products = [
    ("iPhone 15 Pro", "Smartphones", 999.99),
    ("Samsung Galaxy S24", "Smartphones", 849.99),
    ("MacBook Air M3", "Laptops", 1299.00),
    ("Dell XPS 15", "Laptops", 1749.99),
    ("Sony WH-1000XM5", "Headphones", 349.99),
    ("AirPods Pro 2", "Headphones", 249.00),
    ("iPad Pro 12.9", "Tablets", 1099.00),
    ("Kindle Paperwhite", "E-Readers", 139.99),
    ("GoPro Hero 12", "Cameras", 399.99),
    ("Fitbit Charge 6", "Wearables", 159.99),
    ("Nintendo Switch OLED", "Gaming", 349.99),
    ("PS5 Controller", "Gaming", 74.99),
    ("USB-C Hub 7-in-1", "Accessories", 49.99),
    ("Mechanical Keyboard", "Accessories", 129.99),
    ("4K Monitor 27in", "Monitors", 599.99),
    ("Webcam 4K", "Accessories", 89.99),
    ("NVMe SSD 2TB", "Storage", 179.99),
    ("Smart Watch Ultra", "Wearables", 799.00),
    ("Portable Charger 20k", "Accessories", 39.99),
    ("Ring Doorbell Pro", "Smart Home", 229.99),
]
regions = ["North America", "Europe", "Asia Pacific", "Latin America", "Middle East", "Africa"]
channels = ["Web", "Mobile App", "In-Store", "Partner API", "Marketplace"]
payment = ["Credit Card", "PayPal", "Crypto", "Bank Transfer", "Buy Now Pay Later", "Gift Card"]
statuses = ["completed", "completed", "completed", "completed", "refunded", "pending", "failed"]

start = datetime(2023, 1, 1)
rows = []
for i in range(600):
    prod, cat, base_price = random.choice(products)
    qty = random.choices([1,2,3,4,5,10,15,20], weights=[40,25,15,8,5,4,2,1])[0]
    if i in [42, 137, 299, 512]:
        qty = random.randint(80, 200)
    discount = round(random.choices([0, 0.05, 0.10, 0.15, 0.20, 0.30, 0.50], weights=[30,15,20,15,10,7,3])[0], 2)
    unit_price = round(base_price * (1 - discount), 2)
    revenue = round(unit_price * qty, 2)
    shipping = round(random.choices([0, 4.99, 9.99, 19.99, 29.99], weights=[25,30,25,15,5])[0], 2)
    tax_rate = round(random.uniform(0.05, 0.12), 4)
    tax = round(revenue * tax_rate, 2)
    date = start + timedelta(days=random.randint(0, 729))
    rows.append({
        "transaction_id": f"TXN-{100000+i}",
        "date": date.strftime("%Y-%m-%d"),
        "product_name": prod,
        "category": cat,
        "quantity": qty,
        "unit_price": unit_price,
        "discount_pct": discount,
        "revenue": revenue,
        "shipping_cost": shipping,
        "tax_rate": tax_rate,
        "tax_amount": tax,
        "total_amount": round(revenue + shipping + tax, 2),
        "region": random.choice(regions),
        "channel": random.choice(channels),
        "payment_method": random.choice(payment),
        "status": random.choices(statuses, weights=[50,50,50,50,10,8,5])[0],
        "customer_age_group": random.choice(["18-24", "25-34", "35-44", "45-54", "55-64", "65+"]),
        "is_first_purchase": random.choice([True, False, False, False]),
        "rating": None if random.random() < 0.15 else round(random.triangular(1, 5, 4.2), 1),
        "return_requested": random.random() < 0.07,
    })

with open("ecommerce_transactions.csv", "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=rows[0].keys())
    w.writeheader()
    w.writerows(rows)
print(f"ecommerce_transactions.csv: {len(rows)} rows, {len(rows[0])} columns")

# ── 2. Stock Market OHLCV (5 tickers x ~72 trading days) ─────────────────────
tickers = ["AAPL", "GOOGL", "MSFT", "TSLA", "NVDA"]
base_prices = {"AAPL": 175.0, "GOOGL": 140.0, "MSFT": 380.0, "TSLA": 220.0, "NVDA": 495.0}
vol_map = {"AAPL": 0.012, "GOOGL": 0.014, "MSFT": 0.011, "TSLA": 0.035, "NVDA": 0.028}
sectors = {"AAPL": "Technology", "GOOGL": "Technology", "MSFT": "Technology", "TSLA": "Automotive", "NVDA": "Semiconductors"}
stock_rows = []
for ticker in tickers:
    price = base_prices[ticker]
    for day in range(100):
        date = datetime(2024, 1, 2) + timedelta(days=day)
        if date.weekday() >= 5:
            continue
        ret = random.gauss(0.0003, vol_map[ticker])
        if ticker == "TSLA" and day == 23: ret = -0.12
        if ticker == "NVDA" and day == 45: ret = 0.15
        open_ = round(price, 2)
        close = round(price * (1 + ret), 2)
        high = round(max(open_, close) * random.uniform(1.001, 1.02), 2)
        low = round(min(open_, close) * random.uniform(0.98, 0.999), 2)
        volume = int(int(math.exp(16 + 0.5 * random.gauss(0,1))))
        stock_rows.append({
            "date": date.strftime("%Y-%m-%d"),
            "ticker": ticker,
            "open": open_,
            "high": high,
            "low": low,
            "close": close,
            "volume": volume,
            "market_cap_usd": int(close * random.uniform(15e9, 3e12)),
            "daily_return_pct": round(ret * 100, 4),
            "52w_high": round(price * random.uniform(1.05, 1.35), 2),
            "52w_low": round(price * random.uniform(0.65, 0.95), 2),
            "pe_ratio": round(random.uniform(15, 85), 2),
            "sector": sectors[ticker],
        })
        price = close

with open("stock_market_ohlcv.csv", "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=stock_rows[0].keys())
    w.writeheader()
    w.writerows(stock_rows)
print(f"stock_market_ohlcv.csv: {len(stock_rows)} rows, {len(stock_rows[0])} columns")

# ── 3. Hospital Patient Records (400 rows, JSON, nulls + anomalies) ───────────
diagnoses = ["Hypertension", "Type 2 Diabetes", "Asthma", "Coronary Artery Disease",
             "Chronic Kidney Disease", "Depression", "Anxiety Disorder", "Obesity",
             "Hypothyroidism", "COPD", "Atrial Fibrillation", "Osteoarthritis"]
departments = ["Cardiology","Endocrinology","Pulmonology","Nephrology",
               "Psychiatry","Orthopedics","General Medicine","Neurology"]
blood_types = ["A+","A-","B+","B-","AB+","AB-","O+","O-"]
insurers = ["BlueCross BlueShield","Aetna","United Healthcare","Cigna",
            "Humana","Medicare","Medicaid","Self-Pay"]
physicians = ["Dr. Smith","Dr. Johnson","Dr. Patel","Dr. Kim",
              "Dr. Garcia","Dr. Nguyen","Dr. Chen","Dr. Williams"]

patients = []
for i in range(400):
    age = int(random.triangular(18, 95, 52))
    bmi = round(random.gauss(27.5, 5.5), 1)
    if i in [15, 88, 234]: bmi = round(random.uniform(50, 72), 1)
    sys_bp = int(random.gauss(128, 18))
    dia_bp = int(random.gauss(82, 11))
    if i in [30, 150, 310]: sys_bp = random.randint(180, 220)
    admit = datetime(2023, 1, 1) + timedelta(days=random.randint(0, 700))
    los = max(1, int(math.exp(1.5 + 0.7 * random.gauss(0,1))))
    discharge = admit + timedelta(days=los)
    patients.append({
        "patient_id": f"PAT-{10000+i}",
        "admission_date": admit.strftime("%Y-%m-%d"),
        "discharge_date": discharge.strftime("%Y-%m-%d"),
        "age": age,
        "gender": random.choice(["Male","Female","Non-binary"]),
        "blood_type": random.choice(blood_types),
        "bmi": bmi,
        "systolic_bp": sys_bp,
        "diastolic_bp": dia_bp,
        "heart_rate": int(random.gauss(75, 12)),
        "cholesterol_ldl": None if random.random() < 0.2 else round(random.gauss(110, 30), 1),
        "cholesterol_hdl": None if random.random() < 0.2 else round(random.gauss(52, 12), 1),
        "hba1c": None if random.random() < 0.35 else round(random.uniform(4.5, 11.5), 1),
        "primary_diagnosis": random.choice(diagnoses),
        "secondary_diagnosis": None if random.random() < 0.4 else random.choice(diagnoses),
        "department": random.choice(departments),
        "attending_physician": random.choice(physicians),
        "length_of_stay_days": los,
        "icu_admitted": random.random() < 0.12,
        "readmitted_within_30d": random.random() < 0.09,
        "insurance_provider": random.choice(insurers),
        "total_bill_usd": None if random.random() < 0.05 else round(math.exp(8.5 + 1.1 * random.gauss(0,1)), 2),
        "satisfaction_score": None if random.random() < 0.25 else round(random.uniform(1, 10), 1),
    })

with open("hospital_patients.json", "w") as f:
    json.dump(patients, f, indent=2, default=str)
print(f"hospital_patients.json: {len(patients)} records, {len(patients[0])} fields")

# ── 4. IoT Sensor Readings (800 rows, 15-min intervals, anomalies) ────────────
sensors = ["SENS-A1", "SENS-B2", "SENS-C3", "SENS-D4"]
base_temps = {"SENS-A1": 22.0, "SENS-B2": 35.5, "SENS-C3": 18.0, "SENS-D4": 55.0}
locations_map = {
    "SENS-A1": "Floor 1 - Server Room",
    "SENS-B2": "Floor 2 - Lab",
    "SENS-C3": "Basement - Storage",
    "SENS-D4": "Roof - HVAC",
}
sensor_rows = []
ts = datetime(2024, 3, 1, 0, 0, 0)
for i in range(800):
    sensor = sensors[i % 4]
    base_temp = base_temps[sensor]
    temp = round(base_temp + random.gauss(0, 1.5), 2)
    humidity = round(random.gauss(55, 10), 1)
    pressure = round(random.gauss(1013.25, 5), 2)
    vibration = round(abs(random.gauss(0.02, 0.008)), 4)
    if i in [45, 201, 402, 603, 751]:
        temp = round(base_temp + random.uniform(15, 25), 2)
        vibration = round(random.uniform(0.15, 0.45), 4)
    if random.random() < 0.04: humidity = None
    if random.random() < 0.03: pressure = None
    sensor_rows.append({
        "timestamp": ts.strftime("%Y-%m-%d %H:%M:%S"),
        "sensor_id": sensor,
        "location": locations_map[sensor],
        "temperature_c": temp,
        "humidity_pct": humidity,
        "pressure_hpa": pressure,
        "vibration_ms2": vibration,
        "battery_pct": max(0, round(100 - (i // 4) * 0.08, 1)),
        "signal_strength_dbm": int(random.gauss(-65, 8)),
        "alert_triggered": temp > base_temp + 10 or vibration > 0.1,
        "firmware_version": random.choice(["v2.1.3","v2.1.3","v2.1.3","v2.2.0-beta"]),
    })
    ts += timedelta(minutes=15)

with open("iot_sensor_readings.csv", "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=sensor_rows[0].keys())
    w.writeheader()
    w.writerows(sensor_rows)
print(f"iot_sensor_readings.csv: {len(sensor_rows)} rows, {len(sensor_rows[0])} columns")

# ── 5. HR Employee Data (300 rows, JSON) ──────────────────────────────────────
depts = ["Engineering","Product","Sales","Marketing","Finance","HR",
         "Legal","Operations","Data Science","Customer Success"]
levels = ["Junior","Mid","Senior","Lead","Principal","Manager","Director","VP","C-Suite"]
locations_hr = ["San Francisco","New York","Austin","Seattle","London",
                "Berlin","Singapore","Toronto","Bangalore","Remote"]
edu = ["High School","Associate","Bachelor's","Master's","PhD","MBA","Bootcamp"]
skills_pool = ["Python","SQL","React","Java","AWS","Kubernetes","TensorFlow",
               "Go","Rust","Spark","dbt","Tableau","Excel","Figma","Jira"]
base_salary = {
    "Engineering":130000,"Product":125000,"Sales":90000,"Marketing":95000,
    "Finance":105000,"HR":80000,"Legal":120000,"Operations":85000,
    "Data Science":135000,"Customer Success":75000,
}
level_mult = {
    "Junior":0.65,"Mid":0.85,"Senior":1.0,"Lead":1.15,"Principal":1.30,
    "Manager":1.25,"Director":1.55,"VP":2.0,"C-Suite":3.2,
}

employees = []
for i in range(300):
    dept = random.choice(depts)
    level = random.choice(levels)
    yoe = int(random.triangular(0, 25, 5))
    salary = int(base_salary[dept] * level_mult[level] * random.uniform(0.88, 1.15))
    if i in [12, 67, 188, 245]: salary = random.randint(450000, 900000)
    bonus_pct = round(random.triangular(0, 0.35, 0.10), 3)
    hire_date = datetime(2015, 1, 1) + timedelta(days=random.randint(0, 3285))
    perf = round(random.triangular(1.0, 5.0, 3.6), 1)
    employees.append({
        "employee_id": f"EMP-{5000+i}",
        "hire_date": hire_date.strftime("%Y-%m-%d"),
        "department": dept,
        "level": level,
        "location": random.choice(locations_hr),
        "years_of_experience": yoe,
        "base_salary_usd": salary,
        "bonus_pct": bonus_pct,
        "total_compensation_usd": int(salary * (1 + bonus_pct)),
        "education": random.choice(edu),
        "top_skills": random.sample(skills_pool, k=random.randint(2, 6)),
        "remote_work_days": random.choice([0, 1, 2, 3, 4, 5]),
        "performance_score": perf,
        "promoted_last_year": random.random() < 0.18,
        "flight_risk": perf < 2.5 or random.random() < 0.08,
        "manager_id": None if level in ["VP","C-Suite"] else f"EMP-{random.randint(5000,5299)}",
        "tenure_months": int((datetime(2024,12,1) - hire_date).days / 30),
        "attrition_score": round(random.betavariate(2, 8), 3),
    })

with open("hr_employees.json", "w") as f:
    json.dump(employees, f, indent=2, default=str)
print(f"hr_employees.json: {len(employees)} records, {len(employees[0])} fields")

print("\nAll datasets generated successfully.")
