import flask
import sqlite3 #look into SQLITE WAL apparently #https://docs.python.org/3/library/sqlite3.html
con=sqlite3.connect()
cur=con.cursor()
cur.execute("")
con.close()
#flask DEF

CreateText="""
CREATE TABLE Spelltable(
   spell_id TEXT PRIMARY KEY,
   mana_cost INTEGER NOT NULL,
   description TEXT,
   type TEXT NOT NULL,
   ,

);
"""

InsertText="""
INSERT INTO Spelltable (spell_id, mana_cost, description, type) VALUES
   (),
   ()
   ();
"""