from django.shortcuts import render

# Create your views here.
def coming_soon(request):
  return render(request, 'girlsfrontline/coming_soon.html')

def battery_calculator(request):
    return render(request, 'girlsfrontline/battery_calculator.html')
