import sqlite3 #look into SQLITE WAL apparently #https://docs.python.org/3/library/sqlite3.html
con=sqlite3.connect()
cur=con.cursor()
cur.execute("")
con.close()
#flask DEF
