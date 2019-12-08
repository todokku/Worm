import re


def parseSubCount(value):
    num = 0
    end = ''
    if "." in value:
        lookup = re.compile(r"(\d+)[\.](\d+)([a-zA-Z])")
        match = lookup.search(value)
        num = int(match.group(1))
        addon = float('.'+match.group(2))
        end = match.group(3)
        if (end.upper() == "K"):
            num *= 1000
            addon *= 1000
        elif (end.upper() == "M"):
            num *= 1000000
            addon *= 1000000

        num = num + int(addon)

    else:
        lookup = re.compile(r"(\d+)[a-zA-Z]")
        match = lookup.search(value)
        num = int(match.group(1))
        end = value[match.end(1):]
        if (end.upper() == "K"):
            num *= 1000
        elif (end.upper() == "M"):
            num *= 1000000
    return num


def parseViewCount(value):
    value = value.replace(',', '')
    return int(value)
