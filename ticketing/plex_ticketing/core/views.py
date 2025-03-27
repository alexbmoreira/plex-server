from flask import Flask, request, jsonify
from flask_cors import CORS
from ..app.models import Server
import os
from flask_apscheduler import APScheduler
from dateutil import parser
import uuid
from ..app.client_controller import cec_power_on, play_on_chromecast
from ..app.print_tickets import print_tickets

class Config:
    SCHEDULER_API_ENABLED = True

app = Flask(__name__)
app.config['PLEX_URL'] = os.environ.get('PLEX_URL')
app.config['PLEX_TOKEN'] = os.environ.get('PLEX_TOKEN')
app.config['ORIGINS'] = os.environ.get('PLEX_TICKETING_ORIGINS').split()

app.config['CLIENT_NAME'] = os.environ.get('CLIENT_NAME')
app.config['TV_ADDRESS'] = os.environ.get('TV_ADDRESS')
app.config['TV_USERNAME'] = os.environ.get('TV_USERNAME')
app.config['TV_PASSWORD'] = os.environ.get('TV_PASSWORD')

app.config.from_object(Config())

CORS(app, origins=app.config['ORIGINS'])

scheduler = APScheduler()
scheduler.init_app(app)
scheduler.start()

def start_movie(movie):
    cec_power_on(app.config['TV_ADDRESS'], app.config['TV_USERNAME'], app.config['TV_PASSWORD'])
    play_on_chromecast(movie, app.config['CLIENT_NAME'])

@app.route('/api/movies', methods=['GET'])
def list_movies():
    search = request.args.get('filter[search]')

    plex = Server(app.config['PLEX_URL'], app.config['PLEX_TOKEN'])
    all_movies = plex.list_movies(search)

    return jsonify({
        'data': [movie.to_dict() for movie in all_movies],
        'meta': {
            'current_page': 1, # page,
            'total_count': len(all_movies),
            'total_pages': 1, # total_pages,
            'page_size': len(all_movies) # per_page
        }
    })

@app.route('/api/movies/<guid>', methods=['GET'])
def get_movie(guid):
    movie = Server(app.config['PLEX_URL'], app.config['PLEX_TOKEN']).find_movie(guid)
    return jsonify({
        'data': movie.to_dict()
    })

@app.route('/api/movies/<guid>/play', methods=['POST'])
def play_movie(guid):
    data = request.get_json()
    seats = data['seats']
    time = parser.parse(data['time'])
    movie = Server(app.config['PLEX_URL'], app.config['PLEX_TOKEN']).find_movie(guid)

    print_tickets(movie, seats, time)
    scheduler.add_job(
        id=str(uuid.uuid4()),
        func=start_movie,
        trigger='date',
        run_date=time,
        args=[guid]
    )

    return jsonify({
        'data': movie.to_dict()
    })
