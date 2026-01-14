"""
Category keyword mappings for classifying projects.

Each category has:
- id: unique identifier
- label: display name
- emoji: visual indicator
- keywords: list of keywords to match in project descriptions
"""

CATEGORY_DEFINITIONS = {
    "wegenbouw": {
        "id": "wegenbouw",
        "label": "wegenbouw & infrastructuur",
        "emoji": "🛣️",
        "keywords": [
            "weg", "straat", "voetpad", "fietspad", "brug", "rijweg",
            "asfalt", "verharding", "verkeers", "parking", "parkeer",
            "rotonde", "kruispunt", "viaduct", "tunnel", "onderdoorgang",
            "oversteek", "zebrapad", "mobiliteit"
        ]
    },
    "riolering": {
        "id": "riolering",
        "label": "riolering & waterbeheer",
        "emoji": "💧",
        "keywords": [
            "riolering", "afvalwater", "zuivering", "waterloop", "drainage",
            "septische", "hemelwater", "riool", "waterzuivering", "gracht",
            "beek", "afvoer", "drainage", "waterbeheersing", "overstromings"
        ]
    },
    "scholenbouw": {
        "id": "scholenbouw",
        "label": "scholenbouw",
        "emoji": "🏫",
        "keywords": [
            "school", "basisonderwijs", "secundair onderwijs", "kleuterschool",
            "leslokaal", "onderwijsinfra", "schoolgebouw", "klaslokaal",
            "schoolplein", "kleuterklas"
        ]
    },
    "sport": {
        "id": "sport",
        "label": "sportinfrastructuur",
        "emoji": "⚽",
        "keywords": [
            "sport", "sportzaal", "voetbal", "zwembad", "atletiek",
            "tennisbaan", "sporthal", "fitnessruimte", "sportinfra",
            "sportterrein", "speelveld", "sportcomplex", "sportveld",
            "petanque", "skatepark"
        ]
    },
    "cultuur": {
        "id": "cultuur",
        "label": "culturele infrastructuur",
        "emoji": "🎭",
        "keywords": [
            "cultu", "bibliotheek", "museum", "gemeenschapscentrum",
            "jeugdhuis", "theater", "erfgoed", "monument", "kunstcent",
            "zaal", "feestzaal", "cultureel centrum", "historic"
        ]
    },
    "gebouwen": {
        "id": "gebouwen",
        "label": "administratieve & publieke gebouwen",
        "emoji": "🏢",
        "keywords": [
            "gemeentehuis", "administratief centrum", "stadsgebouw",
            "dienstencentrum", "politiepost", "brandweer", "stadskantoor",
            "administratiegebouw", "kantoorruimte"
        ]
    },
    "verlichting": {
        "id": "verlichting",
        "label": "straatverlichting & signalisatie",
        "emoji": "💡",
        "keywords": [
            "straatverlichting", "verlichtingstoestel", "verkeerslicht",
            "signalisatie", "led", "lichtmast", "openbare verlichting",
            "verkeersbordenplan", "bebording", "verkeerssignalisatie"
        ]
    },
    "groen": {
        "id": "groen",
        "label": "groene ruimte & parken",
        "emoji": "🌳",
        "keywords": [
            "park", "groen", "natuur", "beplanting", "begraafplaats",
            "speeltuin", "recreatie", "wandelpad", "bos", "plantso",
            "bomen", "groenvoorziening", "natuurgebied", "recreatiedomein",
            "kerkhof", "begraafwezen"
        ]
    },
    "ruimtelijke-ordening": {
        "id": "ruimtelijke-ordening",
        "label": "ruimtelijke ordening & gebiedsontwikkeling",
        "emoji": "🏘️",
        "keywords": [
            "ruimtelijke", "herinrichting", "gebiedsontwikkeling",
            "stadsvernieuwing", "brownfield", "ruimtelijke ordening",
            "stedenbouw", "onteigening", "verkaveling", "bestemmingsplan"
        ]
    },
    "zorg": {
        "id": "zorg",
        "label": "sociale infrastructuur & zorg",
        "emoji": "♿",
        "keywords": [
            "woonzorgcentrum", "rusthuis", "zorg", "kinderopvang", "crèche",
            "wzc", "rustord", "woonzorg", "dagverzorging", "opvang",
            "sociale", "welzijn"
        ]
    }
}


def classify_project(ac_short, ac_long):
    """
    Classify a project based on keywords in its short and long descriptions.

    Args:
        ac_short: Short description of the action
        ac_long: Long description of the action

    Returns:
        List of category IDs that match the project
    """
    text = f"{ac_short} {ac_long}".lower()
    categories = []

    for category_id, category_def in CATEGORY_DEFINITIONS.items():
        if any(keyword in text for keyword in category_def["keywords"]):
            categories.append(category_id)

    return categories if categories else ["overige"]


def get_category_label(category_id):
    """Get the display label for a category ID."""
    if category_id == "overige":
        return "Overige"
    return CATEGORY_DEFINITIONS.get(category_id, {}).get("label", category_id)


def get_category_emoji(category_id):
    """Get the emoji for a category ID."""
    if category_id == "overige":
        return "📋"
    return CATEGORY_DEFINITIONS.get(category_id, {}).get("emoji", "")
