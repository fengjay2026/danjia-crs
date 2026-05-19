"""Migrate data from data/students -> students and data/scheduleItems -> scheduleItems"""
import urllib.request
import json

BASE = "https://zdstudio-5b6af-default-rtdb.asia-southeast1.firebasedatabase.app"
AUTH = "auth=AIzaSyDFTRECOheHiwuh68MNfodwi6J3el984kw"

def json_get(path):
    url = f"{BASE}{path}.json?{AUTH}"
    return json.loads(urllib.request.urlopen(url).read())

def json_put(path, data):
    url = f"{BASE}{path}.json?{AUTH}"
    req = urllib.request.Request(url, data=json.dumps(data).encode(), method='PUT')
    urllib.request.urlopen(req)

# 1. Migrate students
print("=== Migrate data/students -> students ===")
data_students = json_get("/data/students")
if data_students:
    print(f"Found {len(data_students)} students in data/students")
    for sid, student in data_students.items():
        json_put(f"/students/{sid}", student)
        print(f"  Copied student id={sid}: {student.get('name','?')}")
else:
    print("No data in data/students")

# 2. Migrate schedule items
print("\n=== Migrate data/scheduleItems -> scheduleItems ===")
data_sched = json_get("/data/scheduleItems")
if data_sched:
    print(f"Found {len(data_sched)} items in data/scheduleItems")
    for sid, item in data_sched.items():
        json_put(f"/scheduleItems/{sid}", item)
        print(f"  Copied schedule id={sid}: {item.get('title','?')}")
else:
    print("No data in data/scheduleItems")

# 3. Verify
print("\n=== Verification ===")
students = json_get("/students")
sched = json_get("/scheduleItems")
print(f"students/ -> {len(students) if students else 0} students")
print(f"scheduleItems/ -> {len(sched) if sched else 0} items")
print("\nDone!")
