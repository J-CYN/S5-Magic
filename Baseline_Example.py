from flask import Flask, request, jsonify, render_template

import sqlite3 

con=sqlite3.connect("spells.db") # NEED TO IMPLEMENT A SELECTOR
con.execute("PRAGMA journal_mode=WAL;")
cur=con.cursor()

app = Flask(__name__)

DB_PATH = "spells.db" # NEED TO IMPLEMENT A SELECTOR

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
         mana_cost INTEGER NOT NULL,
      );
   """)
   con.commit()
   con.close()
   return jsonify({"status": "table created"}), 201

@app.post("/api/insert")
def insert(spell):
   #spell = ('1', 'Fireball', 10, 'Offensive')
   data = request.get_json()
   spell = (
      data['spell_id'],
      data['spell_name'],
      data['mana_cost'],
   )
   con = sqlite3.connect(DB_PATH)
   con.execute("PRAGMA journal_mode=WAL;")
   cur = con.cursor()
   cur.execute(
   "INSERT INTO SpellTable (spell_id, spell_name, mana_cost) VALUES (?, ?, ?)",
   spell
   )
   con.commit()
   con.close()
   return jsonify({"status": "spell inserted"}), 201

if __name__ == "__main__":
    app.run(debug=True)