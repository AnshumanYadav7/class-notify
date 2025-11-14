from flask import Flask, render_template
import class_checker  # Import your modified script

app = Flask(__name__)

@app.route('/')
def index():
    # This route will display the main page
    class_statuses = class_checker.check_all_classes()
    return render_template('index.html', statuses=class_statuses)

if __name__ == '__main__':
    app.run(debug=True)