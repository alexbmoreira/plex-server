# Plex Movie Ticket System

## Running the Flask server

Use a virtual environment and pip install dependencies:

```shell
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

Within the virtual environment, run the server:
```shell
export FLASK_APP=run.py
export FLASK_ENV=development
flask run --host=0.0.0.0 --port=5000
```
