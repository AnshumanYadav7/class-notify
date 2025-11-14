import requests
from datetime import datetime
import time

CHECK_INTERVAL_MINUTES = 8
TOPIC = 'susumaanclassalerts'
MAX_NOTIFICATIONS_PER_CLASS = 6

CLASS_SEARCH_NAME = ['CSE 476']
TERM_NUMBER = '2257'

WHITELIST = ['88926']

BASE_API_URL = 'https://eadvs-cscc-catalog-api.apps.asu.edu/catalog-microservices/api/v1/search/classes'

HEADERS = {'Authorization': 'Bearer null'}

notify_tracker = {}

def get_class_urls():
    urls = []
    for item in CLASS_SEARCH_NAME:
        subject, catalogNbr = item.split(' ')
        params = {
            "refine": "Y",
            "campusOrOnlineSelection": "A",
            "catalogNbr": catalogNbr,
            "honors": "F",
            "promod": "F",
            "searchType": "all",
            "subject": subject,
            "term": TERM_NUMBER
        }
        url = f"{BASE_API_URL}?{'&'.join([f'{k}={v}' for k, v in params.items()])}"
        urls.append({'url': url, 'className': item})
    return urls

def fetch_class_data(url, class_name):
    try:
        res = requests.get(url, headers=HEADERS)
        data = res.json()
    except Exception as e:
        return f"Error fetching data for {class_name}: {e}"

    class_statuses = []
    for item in data.get('classes', []):
        class_info = item.get('CLAS', {})
        class_number = class_info.get('CLASSNBR', '')
        if class_number in WHITELIST:
            name = class_name
            title = class_info.get('TITLE', '')
            instructor = ', '.join(class_info.get('INSTRUCTORSLIST', []))
            location = class_info.get('LOCATION', '')
            enrolled = class_info.get('ENRLTOT', '')
            total_seats = class_info.get('ENRLCAP', '')

            try:
                enrolled_num = int(enrolled)
                total_seats_num = int(total_seats)
            except ValueError:
                enrolled_num = total_seats_num = 0

            status = ""
            if enrolled_num < total_seats_num:
                status = f"OPEN SEAT: {name} - {title} ({class_number}). Seats: {enrolled} of {total_seats}"
                # The notification logic can be integrated here or handled in the main app.py
            else:
                status = f"No open seats: {name} - {title} ({class_number}). Seats: {enrolled} of {total_seats}"

            class_statuses.append(status)
    return class_statuses

def check_all_classes():
    all_statuses = []
    urls = get_class_urls()
    for entry in urls:
        statuses = fetch_class_data(entry['url'], entry['className'])
        if statuses:
            all_statuses.extend(statuses)
    return all_statuses