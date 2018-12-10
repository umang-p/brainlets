from django.shortcuts import render
from django.conf import settings
from operator import itemgetter
import json

# Create your views here.
def coming_soon(request):
  return render(request, 'girlsfrontline/coming_soon.html')

def battery_calculator(request):
    return render(request, 'girlsfrontline/battery_calculator.html')

def equip_timers(request):
    with open(settings.STATIC_ROOT+'/girlsfrontline/equip_info.json', mode='r') as data:
        equip_info = json.load(data)

    equip_list = []
    for equip in equip_info:
        if equip['fit_guns'] == '' and equip['cn_name'].find('16lab') == -1 and equip['cn_name'].find('16Lab') == -1 and equip['company'] != '' and (equip['max_level'] != 0 or equip['rank'] == 2):
            info = {}
            info['hours'] = '{0:0>2.0f}'.format(int(equip['develop_duration']) / 60 // 60)
            info['minutes'] = '{0:0>2.0f}'.format(int(equip['develop_duration']) / 60 % 60)
            info['rarity'] = '\u2605' * int(equip['rank'])
            info['type'] = __get_equip_type(equip['type'], equip['cn_name'])
            info['poseffect'] = __get_positive_effect(info['type'])
            info['negeffect'] = __get_negative_effect(info['type'])
            equip_list.append(info)
    equip_list = sorted(equip_list, key=itemgetter('hours','minutes'))
    return render(request, 'girlsfrontline/equip_timers.html', {"equip_list" : equip_list})


def __get_equip_type(equip_type, name):
    equip_type = int(equip_type)
    if equip_type == 1:
        return 'scope'
    elif equip_type == 2:
        return 'EOT'
    elif equip_type == 3:
        return 'red dot sight'
    elif equip_type == 4:
        return 'PEQ'
    elif equip_type == 5:
        return 'AP ammo'
    elif equip_type == 6:
        return 'HP ammo'
    elif equip_type == 7:
        if name.find('#') == -1:
            return 'slug'
        else:
            return 'buck'
    elif equip_type == 8:
        return 'HV ammo'
    elif equip_type == 10:
        if name.find('T') == -1:
            return 'X-exo'
        else:
            return 'T-exo'
    elif equip_type == 11:
        return 'armor'
    elif equip_type == 13:
        return 'suppressor'
    elif equip_type == 14:
        return 'ammo box'
    elif equip_type == 15:
        return 'cape'
    else:
        return 'error'

def __get_positive_effect(equip_type):
    if equip_type == 'scope':
        return '+crit chance'
    elif equip_type == 'EOT':
        return '+accuracy +damage'
    elif equip_type == 'red dot sight':
        return '++acc'
    elif equip_type == 'PEQ':
        return '+night penalty reduction'
    elif equip_type == 'AP ammo':
        return '+armor penetration'
    elif equip_type == 'HP ammo':
        return '+damage'
    elif equip_type == 'slug':
        return '+damage +accuracy'
    elif equip_type == 'buck':
        return '+damage +crit damage'
    elif equip_type == 'HV ammo':
        return '+damage'
    elif equip_type == 'X-exo':
        return '+evasion'
    elif equip_type == 'T-exo':
        return '++evasion'
    elif equip_type == 'armor':
        return '+armor'
    elif equip_type == 'suppressor':
        return '+evasion +crit chance'
    elif equip_type == 'ammo box':
        return '+clip size'
    elif equip_type == 'cape':
        return '+crit damage'
    else:
        return 'error'

def __get_negative_effect(equip_type):
    if equip_type == 'scope':
        return 'none'
    elif equip_type == 'EOT':
        return '-rate of fire'
    elif equip_type == 'red dot sight':
        return '-rate of fire'
    elif equip_type == 'PEQ':
        return 'none'
    elif equip_type == 'AP ammo':
        return 'none'
    elif equip_type == 'HP ammo':
        return '-armor penetration'
    elif equip_type == 'slug':
        return '-targets hit'
    elif equip_type == 'buck':
        return 'none'
    elif equip_type == 'HV ammo':
        return 'none'
    elif equip_type == 'X-exo':
        return 'none'
    elif equip_type == 'T-exo':
        return '-damage'
    elif equip_type == 'armor':
        return '-evasion'
    elif equip_type == 'suppressor':
        return 'none'
    elif equip_type == 'ammo box':
        return '-evasion'
    elif equip_type == 'cape':
        return '-movement speed'
    else:
        return 'error'
