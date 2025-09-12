<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Examples of heatmaps created using HeatmapAPI.com, showcasing different implementations and use cases.">
    <meta property="og:title" content="HeatmapAPI - Examples">
    <meta property="og:description" content="Check out examples of our heatmaps, showcasing different visualization approaches.">
    <title>HeatmapAPI.com</title>
    <link rel="stylesheet" href="styles.css">

    <style>
        /* Set the size of the map */
        #map {
            width: 600px;
            height: 400px;
        }
        .vertical-section {
            margin: 20px 0;
        }
        pre {
            background-color: #f4f4f4;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
        }
        table {
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            padding: 10px;
            text-align: center;
            border: 1px solid #ddd;
        }
        td {
            width: 100px;
            height: 50px;
        }
    </style>
</head>
<body>

<!-- Google Maps API Script -->
<script 
    src="https://maps.googleapis.com/maps/api/js?key=AIzaSyA7pet_N_63TlkDJotZ0qJPbHOvUOEf508&callback=initMap&v=weekly" 
    async defer>
</script>

<!-- Heatmap Script -->
<script>
    let map;
    let heatmapOverlay;
    let dataPoints; // Variable to store the data points
    let isInitialLoad = true; // Flag to check if it's the first load

    function initMap() {
        const center = { lat: 37.775, lng: -122.434 };

        map = new google.maps.Map(document.getElementById("map"), {
            zoom: 12,
            center: center,
            mapTypeId: "satellite",
        });

        // Generate data points when the page loads
        dataPoints = generateRandomPoints(center, 50, 1);

        // Call the service initially and on every zoom or pan
        google.maps.event.addListener(map, 'idle', () => {
            if (isInitialLoad) {
                isInitialLoad = false; // Set the flag to false after the first load
            } else {
                updateHeatmap();
            }
        });
    }

    function updateHeatmap() {
        const bounds = map.getBounds();
        const ne = bounds.getNorthEast(); // Northeast corner
        const sw = bounds.getSouthWest(); // Southwest corner

        if (!Array.isArray(dataPoints) || dataPoints.length === 0) {
            console.error("Data points are not properly defined or are empty.");
            return;
        }

        // Generate comma-separated data points
        try {
            const dataPointsString = dataPoints.map(point => {
                if (point.Lat == null || point.Lon == null || point.Weight == null) {
                    throw new Error("Data point is missing one of the required properties (Lat, Lon, Weight).");
                }
                return `${point.Lat},${point.Lon},${point.Weight}`;
            }).join(",");

            const heatmapParameters = {
                Width: 600,
                Height: 400,
                Lat1: sw.lat(),
                Lat2: ne.lat(),
                Lon1: sw.lng(),
                Lon2: ne.lng(),
                DistanceMultiple: 20,
                UseAverage: false,
                ColorPalette: '1',
                DataPoints: dataPointsString
            };

            callJsonService(heatmapParameters);
        } catch (error) {
            console.error("Error preparing data points string:", error.message);
        }
    }

    function callJsonService(heatmapParameters) {
        const jsonBody = JSON.stringify(heatmapParameters);

		// https://heatmapapi-591111065781.us-west3.run.app/api/createHeatmap
		// https://heatmapapi.com/heatmapapiservices/api/createHeatmap
        fetch('https://heatmapapi-591111065781.us-west3.run.app/api/createHeatmap', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: jsonBody
        })
		.then(response => {
			if (!response.ok) {
				console.error("Network response error:", response.status, response.statusText);
				throw new Error(`Network response was not ok. Status: ${response.status} - ${response.statusText}`);
			}
			return response.blob();
		})
		.then(blob => {
			const url = URL.createObjectURL(blob);

			const bounds = new google.maps.LatLngBounds(
				new google.maps.LatLng(heatmapParameters.Lat1, heatmapParameters.Lon1),
				new google.maps.LatLng(heatmapParameters.Lat2, heatmapParameters.Lon2)
			);

			if (heatmapOverlay) {
				heatmapOverlay.setMap(null);
			}

			heatmapOverlay = new google.maps.GroundOverlay(url, bounds);
			heatmapOverlay.setMap(map);
		})
		.catch(error => {
			console.error('Error updating heatmap:', error.message);
		});
    }

    function generateRandomPoints(center, numPoints, radiusMile) {
        const points = [];
        for (let i = 0; i < numPoints; i++) {
            const lat = center.lat + (Math.random() - 0.5) / 25;
            const lon = center.lng + (Math.random() - 0.5) / 12;
            points.push({ Lat: lat, Lon: lon, Weight: 1 });
        }
        return points;
    }
</script>

<main>

<section class="vertical-section">
    <h1>Example</h1>
    <p>
This map is a live example created with JavaScript and the HeatMapAPI. It connects a Google Map to the API in a backend service, as shown in the JSON POST example below.
			
The script generates 50 random points and overlays them on a Google Map as a heatmap using an image overlay. You can interact with the map by panning and zooming, which triggers a real-time rendering of the heatmap. Each image is generated on the fly, so every request produces a fresh result. This makes it easy to adjust data dynamically while keeping the visualization responsive and flexible, rather than relying on static or tiled images.
		
Unlike the built-in Google Maps heatmap layer, this service is designed to handle very large datasets and render them quickly. You can send a huge number of data points in a single request, and the API produces a heatmap image on the fly. Because the heavy lifting happens in the backend, it avoids the performance issues that come up when trying to push all the rendering into the browser.

	</p>
</section>

<section class="vertical-section">
    <div id="map" style="width: 600px; height: 400px;"></div>
</section>

<section class="vertical-section">
    <h2>JavaScript Code Example</h2>
    <pre>
    &lt;script&gt;
    let map;
    let heatmapOverlay;
    let dataPoints; // Variable to store the data points
    let isInitialLoad = true; // Flag to check if it's the first load

    function initMap() {
        const center = { lat: 37.775, lng: -122.434 };

        map = new google.maps.Map(document.getElementById("map"), {
            zoom: 12,
            center: center,
            mapTypeId: "satellite",
        });

        // Generate data points when the page loads
        dataPoints = generateRandomPoints(center, 50, 1);

        // Call the service initially and on every zoom or pan
        google.maps.event.addListener(map, 'idle', () => {
            if (isInitialLoad) {
                isInitialLoad = false; // Set the flag to false after the first load
            } else {
                updateHeatmap();
            }
        });
    }

    function updateHeatmap() {
        const bounds = map.getBounds();
        const ne = bounds.getNorthEast(); // Northeast corner
        const sw = bounds.getSouthWest(); // Southwest corner

        if (!Array.isArray(dataPoints) || dataPoints.length === 0) {
            console.error("Data points are not properly defined or are empty.");
            return;
        }

        // Generate comma-separated data points
        try {
            const dataPointsString = dataPoints.map(point => {
                if (point.Lat == null || point.Lon == null || point.Weight == null) {
                    throw new Error("Data point is missing one of the required properties (Lat, Lon, Weight).");
                }
                return `${point.Lat},${point.Lon},${point.Weight}`;
            }).join(",");

            const heatmapParameters = {
                Width: 600,
                Height: 400,
                Lat1: sw.lat(),
                Lat2: ne.lat(),
                Lon1: sw.lng(),
                Lon2: ne.lng(),
                DistanceMultiple: 20,
                UseAverage: false,
                ColorPalette: '1',
                DataPoints: dataPointsString
            };


            callJsonService(heatmapParameters);
        } catch (error) {
            console.error("Error preparing data points string:", error.message);
        }
    }

	function callJsonService(heatmapParameters) {
		const jsonBody = JSON.stringify(heatmapParameters);

		fetch('https://heatmapapi-591111065781.us-west3.run.app/api/createHeatmap', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: jsonBody
		})
		.then(response => {
			if (!response.ok) throw new Error(`HTTP error ${response.status}`);
			return response.blob();
		})
		.then(blob => {
			const url = URL.createObjectURL(blob);
			const bounds = new google.maps.LatLngBounds(
				new google.maps.LatLng(heatmapParameters.Lat1, heatmapParameters.Lon1),
				new google.maps.LatLng(heatmapParameters.Lat2, heatmapParameters.Lon2)
			);
			if (heatmapOverlay) heatmapOverlay.setMap(null);
			heatmapOverlay = new google.maps.GroundOverlay(url, bounds);
			heatmapOverlay.setMap(map);
		})
		.catch(err => console.error('Error updating heatmap:', err));
	}


    function generateRandomPoints(center, numPoints, radiusMile) {
        const points = [];
        for (let i = 0; i < numPoints; i++) {
            const lat = center.lat + (Math.random() - 0.5) / 25;
            const lon = center.lng + (Math.random() - 0.5) / 12;
            points.push({ Lat: lat, Lon: lon, Weight: 1 });
        }
        return points;
    }
    &lt;/script&gt;
    </pre>
</section>

<section class="vertical-section">
    <h2>HeatMapAPI Documentation</h2>
    <p>
        The <code>https://heatmapapi-591111065781.us-west3.run.app/api/createHeatmap</code> endpoint allows you to create heatmap overlays dynamically. Below is an overview of the parameters you can use:
    </p>
    <ul>
        <li><strong>Width</strong>: The width of the generated heatmap image in pixels.</li>
        <li><strong>Height</strong>: The height of the generated heatmap image in pixels.</li>
        <li><strong>Lat1</strong>: The top latitude of the map bounding box.</li>
        <li><strong>Lat2</strong>: The bottom latitude of the map bounding box.</li>
        <li><strong>Lon1</strong>: The left longitude of the map bounding box.</li>
        <li><strong>Lon2</strong>: The right longitude of the map bounding box.</li>
        <li><strong>DistanceMultiple</strong>: Controls the spread or influence radius of data points. Depending on the number of points, this value is often around 5 to 30.</li>
        <li><strong>UseAverage</strong>: A boolean indicating whether to use average mode for data point calculations.</li>
        <div style="margin-left:10;">
            If true: The heatmap treats data points as random samples, creating an average representation across the map. This mode is useful for scenarios like weather mapping, where individual measurements are averaged over a larger area to provide a generalized view (e.g., temperature variations across a region).
            <br/>
            If false: The heatmap emphasizes density, treating each point as an individual contributor to the intensity. This mode is ideal for applications like crime mapping, where clusters of incidents create "hotspots" based on proximity and frequency. In this mode, 10 closely grouped points are treated as having the same overall intensity as one point with 10 times the weight (defined by the third parameter in the data points array).
        </div>
        <li><strong>ColorPalette</strong>: A string representing the color palette to use for the heatmap. Available options include predefined color sets, or you can provide custom colors (see below). You send 1, 2, 3, 4, or a custom string of colors as described below.</li>
        <li><strong>DataPoints</strong>: A comma-separated string containing latitude, longitude, and intensity values for each data point. E.g. "37.7749,-122.4194,1,37.7849,-122.4094,2"</li>
    </ul>

    <br/>
    <p>
        The API returns a PNG (blob) heatmap.
    </p>
</section>

<section class="vertical-section">
    <h2>Heatmap Color Palettes</h2>
    <p>
        Below are the four predefined color palettes available for the HeatMapAPI, as well as an option to create a custom color palette. Each predefined palette consists of six distinct colors, ranging from cold (on the table bottom) to hot (top of the table below).
    </p>

    <table border="1" cellspacing="0" cellpadding="5">
        <tr>
            <th>Palette #1 (Default)</th>
            <th>Palette #2</th>
            <th>Palette #3</th>
            <th>Palette #4</th>
        </tr>
        <tr>
            <td style="background-color: #ffffff;">#ffffff</td>
            <td style="background-color: #660000;">#660000</td>
            <td style="background-color: #ff9900;">#ff9900</td>
            <td style="background-color: #174702;">#174702</td>
        </tr>
        <tr>
            <td style="background-color: #ffff33;">#ffff33</td>
            <td style="background-color: #cc0000;">#cc0000</td>
            <td style="background-color: #fff600;">#fff600</td>
            <td style="background-color: #389d0c;">#389d0c</td>
        </tr>
        <tr>
            <td style="background-color: #f2be21;">#f2be21</td>
            <td style="background-color: #ff6600;">#ff6600</td>
            <td style="background-color: #66ff00;">#66ff00</td>
            <td style="background-color: #5d9245;">#5d9245</td>
        </tr>
        <tr>
            <td style="background-color: #fe2a00;">#fe2a00</td>
            <td style="background-color: #ffff33;">#ffff33</td>
            <td style="background-color: #01329e;">#01329e</td>
            <td style="background-color: #86a07b;">#86a07b</td>
        </tr>
        <tr>
            <td style="background-color: #d50243;">#d50243</td>
            <td style="background-color: #8bfe94;">#8bfe94</td>
            <td style="background-color: #000033;">#000033</td>
            <td style="background-color: #9eaa98;">#9eaa98</td>
        </tr>
        <tr>
            <td style="background-color: #9000ff;">#9000ff</td>
            <td style="background-color: #6bffcf;">#6bffcf</td>
            <td style="background-color: #000000;">#000000</td>
            <td style="background-color: #b3b3b3;">#b3b3b3</td>
        </tr>
    </table>
</section>

<section>
    <h3>Custom Color Palette</h3>
    <p>
        You can also create a custom color palette by passing a string of six colors in hexadecimal format, separated by commas. These colors will replace the default colors, giving you full control over the visual appearance of the heatmap. For example instead of sending 1,2,3 or 4, you would send the entire custom color set:
    </p>
    <pre>
        "#123456,#abcdef,#654321,#ffcc00,#00ffcc,#ff00ff"
    </pre>
    <p>
        In the above example, the heatmap will use the specified colors, ranging from the coldest to the hottest point on the map.
    </p>
</section>

<section>
	<h3>Contact</h3>
	<a href="https://github.com/your-username">Contact me on GitHub</a> for questions about hosting your own version of the API or implementing commercial solutions.

</section>


</main>


</body>
</html>
