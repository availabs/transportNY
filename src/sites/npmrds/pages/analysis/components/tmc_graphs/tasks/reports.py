import psycopg2, json

from config import host

def RouteInfoComponent(route_comps, graph_comp):
	title = ""
	if "title" in graph_comp:
		title = graph_comp["title"]
	return {
		"type": "Route Info Box",
		"state": graph_comp["state"],
		"title": title
	}

def main():
	connection = psycopg2.connect(host)
	cursor = connection.cursor()

	sql = """
		SELECT id, route_comps, graph_comps
		FROM admin.collectionreport
		WHERE id = 14
	"""

	cursor.execute(sql)

	types = {}

	for row in cursor:
		route_comps = json.loads(row[1])
		for i in range(len(route_comps)):
			route_comps[i]["compId"] = "comp-{}".format(i)

		graph_comps = json.loads(row[2])
		for i in range(len(graph_comps)):
			if graph_comps[i]["type"] in ["Info Box", "Route Info Box"]:
				graph_comps[i] = RouteInfoComponent(route_comps, graph_comps[i])

	cursor.close()
	connection.close()
# END main

if __name__ == "__main__":
	main()