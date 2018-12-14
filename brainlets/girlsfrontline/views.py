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
            info['rarity'] = int(equip['rank'])
            info['type'] = __get_equip_type(equip['type'], equip['cn_name'])
            info['poseffect'] = __get_positive_effect(info['type'])
            info['negeffect'] = __get_negative_effect(info['type'])
            equip_list.append(info)

    equip_list = sorted(equip_list, key=itemgetter('hours','minutes'))

    return render(request, 'girlsfrontline/equip_timers.html', {"equip_list" : equip_list})

def doll_timers(request):
    with open(settings.STATIC_ROOT+'/girlsfrontline/doll_info.json', mode='r') as data:
        doll_info = json.load(data)

    doll_list = []
    for doll in doll_info:
        if doll['id'] < 1000 and (doll['obtain_ids'] == '1' or doll['obtain_ids'] == '2' or '1' in doll['obtain_ids'].split(',') or '2' in doll['obtain_ids'].split(',')):
            info = {}
            info['hours'] = '{0:0>2.0f}'.format(int(doll['develop_duration']) / 60 // 60)
            info['minutes'] = '{0:0>2.0f}'.format(int(doll['develop_duration']) / 60 % 60)
            info['rarity'] = '\u2605' * int(doll['rank'])
            info['name'] = doll['en_name']
            info['type'] = __get_doll_type(doll['type'])
            doll_list.append(info)

    doll_list = sorted(doll_list, key=itemgetter('hours','minutes'))
    #print(doll_list)
    return render(request, 'girlsfrontline/doll_timers.html', {"doll_list" : doll_list})

def __get_doll_type(doll_type):
    doll_type = int(doll_type)
    if doll_type == 1:
        return 'HG'
    elif doll_type == 2:
        return 'SMG'
    elif doll_type == 3:
        return 'RF'
    elif doll_type == 4:
        return 'AR'
    elif doll_type == 5:
        return 'MG'
    elif doll_type == 6:
        return 'SG'
    else:
        return 'error'

def __get_equip_type(equip_type, name):
    equip_type = int(equip_type)
    if equip_type == 1:
        return 'scope'
    elif equip_type == 2:
        return 'EOT'
    elif equip_type == 3:
        return 'red_dot_sight'
    elif equip_type == 4:
        return 'PEQ'
    elif equip_type == 5:
        return 'ap_ammo'
    elif equip_type == 6:
        return 'hp_ammo'
    elif equip_type == 7:
        if name.find('#') == -1:
            return 'slug'
        else:
            return 'buck'
    elif equip_type == 8:
        return 'hv_ammo'
    elif equip_type == 10:
        if name.find('T') == -1:
            return 'x_exo'
        else:
            return 't_exo'
    elif equip_type == 11:
        return 'armor'
    elif equip_type == 13:
        return 'suppressor'
    elif equip_type == 14:
        return 'ammo_box'
    elif equip_type == 15:
        return 'cape'
    else:
        return 'error'

def __get_positive_effect(equip_type):
    if equip_type == 'scope':
        return '+crit chance'
    elif equip_type == 'EOT':
        return '+accuracy +damage'
    elif equip_type == 'red_dot_sight':
        return '++acc'
    elif equip_type == 'PEQ':
        return '+night penalty reduction'
    elif equip_type == 'ap_ammo':
        return '+armor penetration'
    elif equip_type == 'hp_ammo':
        return '+damage'
    elif equip_type == 'slug':
        return '+damage +accuracy'
    elif equip_type == 'buck':
        return '+damage +crit damage'
    elif equip_type == 'hv_ammo':
        return '+damage'
    elif equip_type == 'x_exo':
        return '+evasion'
    elif equip_type == 't_exo':
        return '++evasion'
    elif equip_type == 'armor':
        return '+armor'
    elif equip_type == 'suppressor':
        return '+evasion +crit chance'
    elif equip_type == 'ammo_box':
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
    elif equip_type == 'red_dot_sight':
        return '-rate of fire'
    elif equip_type == 'PEQ':
        return 'none'
    elif equip_type == 'ap_ammo':
        return 'none'
    elif equip_type == 'hp_ammo':
        return '-armor penetration'
    elif equip_type == 'slug':
        return '-targets hit'
    elif equip_type == 'buck':
        return 'none'
    elif equip_type == 'hv_ammo':
        return 'none'
    elif equip_type == 'x_exo':
        return 'none'
    elif equip_type == 't_exo':
        return '-damage'
    elif equip_type == 'armor':
        return '-evasion'
    elif equip_type == 'suppressor':
        return 'none'
    elif equip_type == 'ammo_box':
        return '-evasion'
    elif equip_type == 'cape':
        return '-movement speed'
    else:
        return 'error'
