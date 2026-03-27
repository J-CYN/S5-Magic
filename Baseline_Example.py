from flask import Flask, request, jsonify, render_template
import json
import sqlite3 

def database_selector(size):
   #depending on what is put in first, change output
   if size == 3:
      return "ThreeElement.db", "ThreeSpells.db", "ThreeSpells.db"
   elif size == 5:
      return "FiveElement.db", "FiveSpells.db", "FiveSpells.db"
   elif size == 7:
      return "SevenElement.db", "SevenSpells.db", "SevenSpells.db"
   elif size == 9:
      return "NineElement.db", "NineSpells.db", "NineSpells.db"
   else:
      raise ValueError(f"Invalid table size: {size}")

ElementalPath, SpellsPath, ModifierPath = database_selector(3)

app = Flask(__name__)

@app.get("/")
def homepage():
    return render_template("input_screen.html")

@app.post("/api/create")
def create():
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
   con.close()

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
   con.close()

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
   con.close()

   return jsonify({"status": "table created"}), 201

@app.get("/api/retrieve")
def retrieve():
   lines_param = request.args.get('lines')
   linesList=json.loads(lines_param)

   # Select the right element
   conElem=sqlite3.connect(ElementalPath)
   conElem.execute("PRAGMA journal_mode=WAL;")
   curElem=conElem.cursor()
   curElem.execute("SELECT * FROM ElementalTable WHERE lines = ?", (json.dumps(linesList[0]),))

   # Modifier table that selects the modifier
   conMod=sqlite3.connect(ModifierPath)
   conMod.execute("PRAGMA journal_mode=WAL;")
   curMod=conMod.cursor()
   curMod.execute("SELECT * FROM ModifierTable WHERE lines = ?", (json.dumps(linesList[2]),))

   #Spelldb selector
   conSpell = sqlite3.connect(SpellsPath)
   conSpell.execute("PRAGMA journal_mode=WAL;")
   curSpell = conSpell.cursor()
   curSpell.execute("SELECT * FROM SpellTable WHERE lines = ?", (json.dumps(linesList[1]),))

   #Grab what they found
   element = curElem.fetchone()
   spell = curSpell.fetchone()
   modifier = curMod.fetchone()

   #Close connections
   conSpell.close()
   conElem.close()
   conMod.close()

   # If nothing in element or spell return "not found"
   if (element is None or spell is None):
      return jsonify({"status": "not found"}), 404

   # Send back the total information
   return jsonify({
      "lines": json.dumps(linesList), #return the lines
      "spell_name": f"{element[1]} {spell[1]} {modifier[1]}", #addition of three strings,
      "mana_cost": spell[2] + modifier[2] #addition of both mana costs
   }), 200
   
#@app.post("/api/insert")
#def insert():
   #spell = ('1-2-4-5', 'Fireball', 100)
#   data = request.get_json()

#   spell = (
#      json.dumps(data['lines']),
#      data['spell_name'],
#      data['mana_cost'],
#   )

#   con = sqlite3.connect(three_database_selector())
#   con.execute("PRAGMA journal_mode=WAL;")
#   cur = con.cursor()

#   cur.execute(
#   "INSERT INTO SpellTable (lines, spell_name, mana_cost) VALUES (?, ?, ?)",
#   spell
#   )

#   con.commit()
#   con.close()
#   return jsonify({"status": "spell inserted"}), 201

if __name__ == "__main__":
    app.run(debug=True)