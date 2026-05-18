from flask import Flask, request, jsonify, render_template
import json
import os
import sqlite3 
import bcrypt

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def database_selector(size):
   #depending on what is put in first, change output
   if size == 3:
      return (
         os.path.join(BASE_DIR, "ThreeElement.db"),
         os.path.join(BASE_DIR, "ThreeSpells.db"),
         os.path.join(BASE_DIR, "ThreeModifier.db")
      )
   elif size == 5:
      return (
         os.path.join(BASE_DIR, "FiveElement.db"),
         os.path.join(BASE_DIR, "FiveSpells.db"),
         os.path.join(BASE_DIR, "FiveModifier.db")
      )
   elif size == 7:
      return (
         os.path.join(BASE_DIR, "SevenElement.db"),
         os.path.join(BASE_DIR, "SevenSpells.db"),
         os.path.join(BASE_DIR, "SevenModifier.db")
   )
   elif size == 9:
      return (
         os.path.join(BASE_DIR, "NineElement.db"),
         os.path.join(BASE_DIR, "NineSpells.db"),
         os.path.join(BASE_DIR, "NineModifier.db")
   )
   else:
      raise ValueError(f"Invalid table size: {size}")
   
def create():
   try:
      con = sqlite3.connect(SpellsPath)
      con.execute("PRAGMA journal_mode=WAL;")
      cur = con.cursor()
      cur.execute("""
         CREATE TABLE IF NOT EXISTS SpellTable(
            lines TEXT PRIMARY KEY,
            spell_name TEXT NOT NULL,
            mana_cost INTEGER NOT NULL
         );
      """)
      con.commit()
   finally:
      con.close()

   try:
      con = sqlite3.connect(ElementalPath)
      con.execute("PRAGMA journal_mode=WAL;")
      cur = con.cursor()
      cur.execute("""
         CREATE TABLE IF NOT EXISTS ElementalTable(
            lines TEXT PRIMARY KEY,
            element_name TEXT NOT NULL
         );
      """)
      con.commit()
   finally:
      con.close()

   try:
      con = sqlite3.connect(ModifierPath)
      con.execute("PRAGMA journal_mode=WAL;")
      cur = con.cursor()
      cur.execute("""
         CREATE TABLE IF NOT EXISTS ModifierTable(
            lines TEXT PRIMARY KEY,
            modifier_name TEXT NOT NULL,
            mana_cost INTEGER NOT NULL
         );
      """)
      con.commit()
   finally:
      con.close()

   try:
      con = sqlite3.connect(LoginPath)
      con.execute("PRAGMA journal_mode=WAL;")
      cur = con.cursor()
      cur.execute("""
         CREATE TABLE IF NOT EXISTS LoginTable(
            user TEXT PRIMARY KEY,
            pass TEXT NOT NULL,
            accountID TEXT NOT NULL
         );
      """)
      con.commit()
   finally:
      con.close()

ElementalPath, SpellsPath, ModifierPath = database_selector(3)
LoginPath = os.path.join(BASE_DIR, "Login.db")
AccountPath = None

app = Flask(__name__)
create()

@app.get("/")
def homepage():
   return render_template("login_screen.html")

@app.get("/table")
def tablepage():
   return render_template("input_screen.html")

@app.post("/api/login")
def login():
   data = request.get_json()
   username = data.get('user')
   password = data.get('pass')

   try:
      conPass = sqlite3.connect(LoginPath)
      conPass.execute("PRAGMA journal_mode=WAL;")
      curPass = conPass.cursor()
      curPass.execute("SELECT * FROM LoginTable WHERE user = ?", (username,))
      account = curPass.fetchone()
   finally:
      conPass.close()

   if account is None or not bcrypt.checkpw(password.encode(), account[1].encode()):
      return jsonify({"status": "not found"}), 404

   AccountPath = os.path.join(BASE_DIR, str(account[2]) + ".db")

   try:
      con = sqlite3.connect(AccountPath)
      con.execute("PRAGMA journal_mode=WAL;")
      cur = con.cursor()
      cur.execute("""
         CREATE TABLE IF NOT EXISTS AccountTable(
            name TEXT PRIMARY KEY,
            lines TEXT NOT NULL
         );
      """)
      con.commit()
   finally:
      con.close()

   return jsonify({"status": "found"}), 200

@app.post("/api/register")
def register():
   data = request.get_json()
   username = data.get('user')
   password = data.get('pass')

   hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())

   conPass = sqlite3.connect(LoginPath)
   conPass.execute("PRAGMA journal_mode=WAL;")
   curPass = conPass.cursor()

   try:
      curPass.execute(
         "INSERT INTO LoginTable (user, pass) VALUES (?, ?)",
         (username, hashed.decode())  # decode to store as string
      )
      conPass.commit()
      return jsonify({"status": "created"}), 201
   except sqlite3.IntegrityError:
      # Username is a primary key and thus will return an error if user is the same as another
      return jsonify({"status": "user already exists"}), 409
   finally:
      conPass.close()

@app.get("/api/retrieve")
def retrieve():
   # Importing lines and error handling in case the input isn't valid
   lines_param = request.args.get('lines')
   if lines_param is None:
      return jsonify({"status": "bad request"}), 400
    
   linesList = json.loads(lines_param)
   if len(linesList) < 2:
      return jsonify({"status": "bad request"}), 400

   # If there is a third line, there is a modifier
   has_modifier = len(linesList) >= 3

   # Select the right element
   try:
      conElem = sqlite3.connect(ElementalPath)
      conElem.execute("PRAGMA journal_mode=WAL;")
      curElem = conElem.cursor()
      curElem.execute("SELECT * FROM ElementalTable WHERE lines = ?", (json.dumps(linesList[0]),))
      element = curElem.fetchone()
   finally:
      conElem.close()

   # Select the right spell
   try:
      conSpell = sqlite3.connect(SpellsPath)
      conSpell.execute("PRAGMA journal_mode=WAL;")
      curSpell = conSpell.cursor()
      curSpell.execute("SELECT * FROM SpellTable WHERE lines = ?", (json.dumps(linesList[1]),))
      spell = curSpell.fetchone()
   finally:
      conSpell.close()

   # Modifier table that selects the modifier if has_modifier is true
   modifier = None
   if has_modifier:
      try:
         conMod = sqlite3.connect(ModifierPath)
         conMod.execute("PRAGMA journal_mode=WAL;")
         curMod = conMod.cursor()
         curMod.execute("SELECT * FROM ModifierTable WHERE lines = ?", (json.dumps(linesList[2]),))
         modifier = curMod.fetchone()
      finally:
         conMod.close()

   # Make sure the spell and element are valid as you need both for a valid output
   if element is None or spell is None:
      return jsonify({"status": "not found"}), 404

   # If modifier is expected, check that the modifier exists
   if has_modifier and modifier is None:
      return jsonify({"status": "modifier not found"}), 404

   if has_modifier: # Three part spell 
      return jsonify({ 
         "lines": json.dumps(linesList),
         "element_name": element[1],
         "spell_name": spell[1],
         "spell_mana_cost": spell[2],
         "modifier_name": modifier[1],
         "modifier_mana_cost": modifier[2],
         "full_spell_name": f"{element[1]} {spell[1]} {modifier[1]}", #Name is made up of components
         "mana_cost": spell[2] + modifier[2] # Total spell cost
      }), 200
   else: # Two part spell
      return jsonify({
         "lines": json.dumps(linesList),
         "element_name": element[1],
         "spell_name": spell[1],
         "spell_mana_cost": spell[2],
         "modifier_name": "",
         "modifier_mana_cost": "",
         "full_spell_name": f"{element[1]} {spell[1]}",
         "mana_cost": spell[2]
      }), 200

@app.post("/api/insert")
def insert():
   # Validate the data
   data = request.get_json()
   if data is None:
      return jsonify({"status": "bad request"}), 400

   # The qualities needed to submit both the element and the spell at least, which are validated to exist
   required = ['element_lines', 'element_name', 'spell_lines', 'spell_name', 'spell_mana_cost']
   if not all(key in data for key in required):
      return jsonify({"status": "bad request"}), 400

   # Submit the element if it is new and not seen before
   try:
      conElem = sqlite3.connect(ElementalPath)
      conElem.execute("PRAGMA journal_mode=WAL;")
      curElem = conElem.cursor()
      curElem.execute(
         "INSERT OR IGNORE INTO ElementalTable (lines, element_name) VALUES (?, ?)",
         (json.dumps(data['element_lines']), data['element_name'])
      )
      conElem.commit()
   finally:
      conElem.close()

   # Try to submit the spell into the table if not seen before
   try:
      conSpell = sqlite3.connect(SpellsPath)
      conSpell.execute("PRAGMA journal_mode=WAL;")
      curSpell = conSpell.cursor()
      curSpell.execute(
         "INSERT OR IGNORE INTO SpellTable (lines, spell_name, mana_cost) VALUES (?, ?, ?)",
         (json.dumps(data['spell_lines']), data['spell_name'], data['spell_mana_cost'])
      )
      conSpell.commit()
   finally:
      conSpell.close()

   # If the modifier_lines are submitted, try to submit that modifier   
   if data.get('modifier_lines') is not None:
      try:
         conMod = sqlite3.connect(ModifierPath)
         conMod.execute("PRAGMA journal_mode=WAL;")
         curMod = conMod.cursor()
         curMod.execute(
             "INSERT OR IGNORE INTO ModifierTable (lines, modifier_name, mana_cost) VALUES (?, ?, ?)",
             (json.dumps(data['modifier_lines']), data['modifier_name'], data['modifier_mana_cost'])
         )
         conMod.commit()
      finally:
         conMod.close()

   return jsonify({"status": "spell inserted"}), 201

if __name__ == "__main__":
    app.run(debug=True)