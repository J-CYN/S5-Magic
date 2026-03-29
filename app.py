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

ElementalPath, SpellsPath, ModifierPath = database_selector(3)

app = Flask(__name__)
create()

@app.get("/")
def homepage():
    return render_template("input_screen.html")

@app.get("/api/retrieve")
def retrieve():
   modifier = None
   element = None
   spell = None

   lines_param = request.args.get('lines')
   linesList=json.loads(lines_param)

   # Select the right element
   conElem=sqlite3.connect(ElementalPath)
   conElem.execute("PRAGMA journal_mode=WAL;")
   curElem=conElem.cursor()
   curElem.execute("SELECT * FROM ElementalTable WHERE lines = ?", (json.dumps(linesList[0]),))

   #Spelldb selector
   conSpell = sqlite3.connect(SpellsPath)
   conSpell.execute("PRAGMA journal_mode=WAL;")
   curSpell = conSpell.cursor()
   curSpell.execute("SELECT * FROM SpellTable WHERE lines = ?", (json.dumps(linesList[1]),))

   # Modifier table that selects the modifier
   if(len(linesList) >= 3):
      conMod=sqlite3.connect(ModifierPath)
      conMod.execute("PRAGMA journal_mode=WAL;")
      curMod=conMod.cursor()
      curMod.execute("SELECT * FROM ModifierTable WHERE lines = ?", (json.dumps(linesList[2]),))

   #Grab what they found
   element = curElem.fetchone()
   spell = curSpell.fetchone()
   if(len(linesList) >= 3):
      modifier = curMod.fetchone()

   #Close connections
   conSpell.close()
   conElem.close()
   if(len(linesList) >= 3):
      conMod.close()

   # If nothing in element or spell return "not found"
   if (element is None or spell is None):
      return jsonify({"status": "not found"}), 404
   
   if (len(linesList) >= 3 and modifier is None):
      return jsonify({"status": "modifier not found"}), 404

   if (len(linesList) >= 3):
      # Send back the total information
      return jsonify({
         "lines": json.dumps(linesList), #return the lines
         "modifier_name": f"{modifier[1]}",
         "spell_name": f"{spell[1]}",
         "full_spell_name": f"{element[1]} {spell[1]} {modifier[1]}", #addition of three strings,
         "mana_cost": spell[2] + modifier[2] #addition of both mana costs
      }), 200
   else :
      # Send back the partial information
      return jsonify({
         "lines": json.dumps(linesList), #return the lines
         "modifier_name": "",
         "spell_name":f"{spell[1]}",
         "full_spell_name": f"{element[1]} {spell[1]}", #addition of three strings,
         "mana_cost": spell[2] #addition of both mana costs
      }), 200
   
@app.post("/api/insert")
def insert():
   #spell = ('1-2-4-5', 'Fireball', 100)
   data = request.get_json()
   
   # Select the right element
   conElem = sqlite3.connect(ElementalPath)
   conElem.execute("PRAGMA journal_mode=WAL;")
   curElem = conElem.cursor()
   curElem.execute(
      "INSERT INTO ElementalTable (lines, element_name) VALUES (?, ?)",
      (json.dumps(data['element_lines']), data['element_name'])
   )

   #Spelldb selector
   conSpell = sqlite3.connect(SpellsPath)
   conSpell.execute("PRAGMA journal_mode=WAL;")
   curSpell = conSpell.cursor()
   curSpell.execute(
      "INSERT INTO SpellTable (lines, spell_name, mana_cost) VALUES (?, ?, ?)",
      (json.dumps(data['spell_lines']), data['spell_name'], data['spell_mana_cost'])
   )

   conElem.commit()
   conElem.close()
   conSpell.commit()
   conSpell.close()

   if data['modifier_lines'] is not None:
      conMod = sqlite3.connect(ModifierPath)
      conMod.execute("PRAGMA journal_mode=WAL;")
      curMod = conMod.cursor()
      curMod.execute(
         "INSERT INTO ModifierTable (lines, modifier_name, mana_cost) VALUES (?, ?, ?)",
         (json.dumps(data['modifier_lines']), data['modifier_name'], data['modifier_mana_cost'])
      )
      conMod.commit()
      conMod.close()

   return jsonify({"status": "spell inserted"}), 201

if __name__ == "__main__":
    app.run(debug=True)