from databricks.sdk import WorkspaceClient
from dotenv import load_dotenv
from fastapi import FastAPI
import os

load_dotenv()

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "The databricks bot is now active."}

client = WorkspaceClient(
    host=os.getenv("DATABRICKS_HOST"),
    token=os.getenv("DATABRICKS_TOKEN")
)

class Databricks:
    def __init__(self, client):
        self.client = client

    def search(self):
        pass

    def add(self):
        pass

    def list(self):
        catalogs = self.client.catalogs.list()
        catalog_names = []

        for catalog in catalogs:
            catalog_names.append(catalog.name)

        return catalog_names 

    def update(self):
        pass 

    def delete(self):
        pass

# user = client.current_user.me()

# print(user.user_name)


if __name__ == "__main__":
    bot = Databricks(client)
    print(bot.list())

