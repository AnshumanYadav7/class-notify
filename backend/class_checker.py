import requests

BASE_API_URL = 'https://eadvs-cscc-catalog-api.apps.asu.edu/catalog-microservices/api/v1/search/classes'
HEADERS = {'Authorization': 'Bearer null'}

def get_full_schedule(class_info):
    """
    Parses all known locations for schedule data to create a detailed string
    for the live status cards.
    """
    schedule_parts = set()

    # Source 1: The nested MEETINGSLIST
    if 'MEETINGSLIST' in class_info:
        for meeting in class_info.get('MEETINGSLIST', []):
            days = meeting.get('DAYSLIST', '')
            start = meeting.get('STARTTIME', '')
            if days and start:
                end = meeting.get('ENDTIME', '')
                building = meeting.get('BUILDINGCD', '')
                room = meeting.get('ROOM', '')
                location_str = f" ({building} {room})" if building and room else ""
                
                days = days.replace('<br/>&nbsp;', '').strip()
                start = start.replace('<br/>&nbsp;', '').strip()
                end = end.replace('<br/>&nbsp;', '').strip()
                
                if days and start and end:
                    schedule_parts.add(f"{days} {start} - {end}{location_str}")

    # Source 2: The "flattened" parallel arrays
    if not schedule_parts and 'DAYLIST' in class_info and isinstance(class_info.get('DAYLIST'), list):
        # This block is a fallback if MEETINGSLIST was empty or missing
        days_list, start_times, end_times = class_info.get('DAYLIST', []), class_info.get('STARTTIMES', []), class_info.get('ENDTIMES', [])
        min_len = min(len(days_list), len(start_times), len(end_times))
        if min_len > 0:
            for i in range(min_len):
                day, start, end = days_list[i], start_times[i], end_times[i]
                if day and start and end and day.strip() and day != '&nbsp;':
                    location = class_info.get('FACILITYID', 'TBD')
                    schedule_parts.add(f"{day} {start} - {end} ({location})")

    if schedule_parts:
        return " | ".join(sorted(list(schedule_parts)))

    # Fallback to instruction mode if no specific times were found
    instruction_mode = class_info.get('INSTRUCTIONMODE', '')
    if instruction_mode in ['Online', 'ASO', 'OL']: return "ASU Online"
    if instruction_mode: return instruction_mode
        
    return "Schedule TBD"

def get_schedule_abbreviation(class_info):
    """
    Creates a simple abbreviation for the search results list, as seen in the screenshot.
    """
    instruction_mode = class_info.get('INSTRUCTIONMODE', '')
    
    if instruction_mode in ['Online', 'ASO', 'OL']:
        return "ASU Online"
    
    # Any class with a physical or synchronous component is marked as (P)
    if instruction_mode in ['P', 'HY', 'SYNC']:
        return "P"
    
    # If the mode is ambiguous but there are meeting times, it's also physical/synchronous
    if class_info.get('MEETINGSLIST') or class_info.get('STARTTIMES'):
        return "P"

    return "TBD"

def fetch_class_details(class_name, term_number):
    """
    Fetches all sections for a class, now including both full and abbreviated schedules.
    """
    try:
        parts = class_name.strip().upper().split(' ')
        subject, catalog_nbr = parts[0], parts[1]
    except IndexError:
        return [{"error": f"Invalid format for '{class_name}'. Use 'SUBJECT NUMBER'."}]

    params = {"refine": "Y", "searchType": "all", "subject": subject, "catalogNbr": catalog_nbr, "term": term_number}
    url = f"{BASE_API_URL}?{'&'.join([f'{k}={v}' for k, v in params.items()])}"
    
    try:
        res = requests.get(url, headers=HEADERS); res.raise_for_status(); data = res.json()
    except requests.exceptions.RequestException as e:
        return [{"error": f"API Error for {class_name}: {e}"}]

    if not data.get('classes'): return []

    detailed_classes = []
    for item in data.get('classes', []):
        class_info = item.get('CLAS', {})
        instructors = class_info.get('INSTRUCTORSLIST', [])

        detailed_class = {
            "className": f"{subject} {catalog_nbr}",
            "classNumber": class_info.get('CLASSNBR', ''),
            "title": class_info.get('TITLE', ''),
            "status": "OPEN" if int(class_info.get('ENRLTOT', 0)) < int(class_info.get('ENRLCAP', 0)) else "FULL",
            "seats": f"{class_info.get('ENRLTOT', 0)} / {class_info.get('ENRLCAP', 0)}",
            "instructor": ', '.join(instructors) if instructors else 'Staff',
            "schedule": get_full_schedule(class_info),
            "scheduleAbbreviation": get_schedule_abbreviation(class_info)
        }
        detailed_classes.append(detailed_class)
        
    return detailed_classes