from django.shortcuts import render
from django.conf import settings
from operator import itemgetter
import json

# Create your views here.
def coming_soon(request):
  return render(request, 'girlsfrontline/coming_soon.html')

def battery_calculator(request):
    return render(request, 'girlsfrontline/battery_calculator.html')

def home(request):
    return render(request, 'girlsfrontline/home.html')

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

    UNRELEASED_IN_EN = ['K5', 'Px4 Storm', 'NZ75', 'F1', 'Z-62', 'PP1901', 'C-MS', 'ARX-160', 'XM8', 'SAR-21', 'OTs-44', 'K2', 'MDR', 'AN94', 'K11', 'AK12', 'SPR A3G', 'PSG-1', 'G28', 'PzB39', 'Carcano M1891', 'Carcano M91/38', '80type', 'Type88', 'M1014', 'M1897', 'SPAS-12', 'Saiga-12', 'FP-6', 'AA-12']
    ALIASES = {'FNP-9':'FF FNP9', 'USP Compact':'Gr USPCompact', 'Type 92':'Type92', 'PM':'Makarov', '357':'Astra', 'TT33':'Tokarev', 'M1873':'SAA Colt Revolver', 'Mk23':'Gr Mk23', 'APS':'Stechkin', 'Type 64':'Type64', 'MAB 38':'M38', 'Sten Mk II':'STEN MkII', 'MAC-10':'Ingram', 'Vz. 61':'Skorpion', 'MP5':'Gr MP5', 'KP/-31 ':'Suomi', 'M1928A1':'Thompson', 'G36C':'Gr G36c', 'Type 79':'Type79', 'AR':'Galil', 'F2000':'FF F2000', 'Type 63':'Type63', 'G3':'Gr G3', 'FN-49':'FF FN49', 'BM59':'VM59', 'FNC':'FF FNC', 'Type 56-1 A':'Type56-1', 'FAMAS':'Fr FAMAS', 'G36':'Gr G36', 'Ribeyrolles1918':'Ribeyrolles', 'Type 88':'Type88', 'Type 95':'Type95', 'Type 97':'Type97', 'HK416':'416', 'RFB':'Am RFB', 'M1':'M1 Garand', 'G11':'Gr G11', 'G41':'Gr G41', 'Zastava M21':'Zas M21', 'M1891':'Mosin-Nagant', 'M1903':'Springfield', 'MLE Mk I':'Lee Enfield', 'Bren MK I':'Bren', 'NEGEV':'Negev', 'MG4':'Gr MG4', 'MG5':'Gr MG5', 'Pecheneg':'PKP', 'USAS12':'USAS-12', 'KSG':'Am KSG', 'SAT8':'S.A.T.8'}

    doll_list = []
    for doll in doll_info:
        if doll['id'] < 1000 and (doll['obtain_ids'] == '1' or doll['obtain_ids'] == '2' or '1' in doll['obtain_ids'].split(',') or '2' in doll['obtain_ids'].split(',')):
            if doll['en_name'] in UNRELEASED_IN_EN:
                continue
            info = {}
            info['hours'] = '{0:0>2.0f}'.format(int(doll['develop_duration']) / 60 // 60)
            info['minutes'] = '{0:0>2.0f}'.format(int(doll['develop_duration']) / 60 % 60)
            info['rarity'] = int(doll['rank'])
            if doll['en_name'] in ALIASES.keys():
                info['name'] = ALIASES[doll['en_name']]
            else:
                info['name'] = doll['en_name']
            info['type'] = __get_doll_type(doll['type'])
            doll_list.append(info)

    doll_list = sorted(doll_list, key=itemgetter('hours','minutes'))

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
