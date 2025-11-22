const DICTIONARY = [
    // 7 Letters
    "AMONGST", "BAYONET", "CAPTAIN", "DIAMOND", "EASTERN", "FEATURE", "GALLERY", "HABITAT",
    "ILLEGAL", "JOURNEY", "KITCHEN", "LIBERTY", "MACHINE", "NATURAL", "OFFICER", "PACKAGE",
    "QUALITY", "RECEIVE", "SECTION", "TEACHER", "UNICORN", "VICTORY", "WELCOME", "XYLOID",
    "YARDAGE", "ZOOLOGY", "ANCIENT", "BALANCE", "CAREFUL", "DEFENSE", "ECONOMY", "FACTORY",

    // 5 Letters
    "APPLE", "BEACH", "CHAIR", "DANCE", "EAGLE", "FLAME", "GRAPE", "HEART", "IGLOO", "JUMP", // JUMP is 4
    "KITES", "LEMON", "MOUSE", "NIGHT", "OCEAN", "PIANO", "QUEEN", "RIVER", "SNAKE", "TIGER",
    "WHALE", "YACHT", "ZEBRA", "SHEEP", "STORY", "PLANT", "SPACE", "KNACK", "YEARS", "LATTE",
    "RIOT", "BREAD", "CLOUD", "DREAM", "FRUIT", "GHOST", "HOUSE", "JUICE", "LIGHT", "MONEY",
    "NURSE", "PARTY", "RADIO", "SKIRT", "TABLE", "VOICE", "WATER", "YOUNG",

    // 4 Letters
    "LAMB", "LION", "BEAR", "BIRD", "DUCK", "FROG", "GOAT", "HAWK", "KIWI", "MOTH",
    "ORCA", "PUMA", "SEAL", "SWAN", "TUNA", "WOLF", "WORM", "YAK", "ZINC", "JUMP",
    "WALK", "TALK", "SING", "PLAY", "READ", "COOK", "SWIM", "FISH",

    // 3 Letters
    "CAT", "DOG", "FOX", "OWL", "BAT", "ANT", "BEE", "COW", "PIG", "HEN",
    "RED", "RUN", "SIT", "EAT", "FLY", "SKY", "SUN", "SEA", "TEA", "BOX"
];

// Helper to check if a word exists
function isWord(word) {
    return DICTIONARY.includes(word.toUpperCase());
}
