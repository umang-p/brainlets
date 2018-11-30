from django.shortcuts import render

# Create your views here.
def index(request):
    return render(request, 'brainlets/index.html')

def about(request):
    return render(request, 'brainlets/about.html', {'github_url': 'https://github.com/umang-p/brainlets'})
