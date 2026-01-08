from flask import Flask, request, jsonify, render_template
import sqlite3 
con=sqlite3.connect("spells.db")
con.execute("PRAGMA journal_mode=WAL;")
cur=con.cursor()


app = Flask(__name__)

DB_PATH = "spells.db"

@app.get("/")
def homepage():
    return render_template("input_screen.html")

@app.post("/api/create")
def create():
   con = sqlite3.connect(DB_PATH)
   con.execute("PRAGMA journal_mode=WAL;")
   cur = con.cursor()
   cur.execute("""
      CREATE TABLE IF NOT EXISTS SpellTable(
         spell_id TEXT PRIMARY KEY,
         spell_name TEXT NOT NULL,
         description TEXT,
         mana_cost INTEGER NOT NULL,
         type TEXT NOT NULL
      );
   """)
   con.commit()
   con.close()
   return jsonify({"status": "table created"}), 201

@app.post("/api/insert")
def insert(spell):
   #spell = ('1', 'Fireball', 'A ball of fire', 10, 'Offensive')
   data = request.get_json()
   spell = (
      data['spell_id'],
      data['spell_name'],
      data.get('description', ''),
      data['mana_cost'],
      data['type']
   )
   con = sqlite3.connect(DB_PATH)
   con.execute("PRAGMA journal_mode=WAL;")
   cur = con.cursor()
   cur.execute(
   "INSERT INTO SpellTable (spell_id, spell_name, description, mana_cost, type) VALUES (?, ?, ?, ?, ?)",
   spell
   )
   con.commit()
   con.close()
   return jsonify({"status": "spell inserted"}), 201

if __name__ == "__main__":
    app.run(debug=True)