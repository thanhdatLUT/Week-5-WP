const GEOJSON_URL = 'https://geo.stat.fi/geoserver/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=tilastointialueet:kunta4500k&outputFormat=json&srsName=EPSG:4326';
const MIGRATION_URL = 'https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/muutl/11a2.px';
const fetchData = async () => {
    const response = await fetch(GEOJSON_URL);
    const data = await response.json();

    const queryResponse = await fetch("./migration_data_query.json");
    const query = await queryResponse.json();

    const migrationResponse = await fetch(MIGRATION_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(query)
    });
    const migrationData = await migrationResponse.json(
    )


    initMap(data, migrationData);
}

const initMap = (data, migrationData) => {

    const map = L.map('map', {
        minZoom: -3
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const municipalityNames = migrationData.dimension.alue_23_20260101.category.label;
    const values = migrationData.value;
    console.log(migrationData);
    const migrationMap = {};

    Object.keys(municipalityNames).forEach((key, index) => {
        migrationMap[municipalityNames[key]] = {
            positive: values[index * 2],
            negative: values[index * 2 + 1]
        };
    });
    const geoJson = L.geoJson(data, {
        style: (feature) => {
            const info = migrationMap[feature.properties.nimi];

            if (!info) {
                return {
                    weight: 2
                };
            }
        
            let hue = (info.positive / info.negative) ** 3 * 60;

            hue = Math.min(hue,120);

            return {
                weight: 2,
                color: `hsl(${hue}, 75%, 50%)`
            };
        
        },

        onEachFeature: (feature, layer) => {
            const name = feature.properties.nimi;
            const info = migrationMap[name];
            layer.bindTooltip(name);

            if (info) {
                layer.bindPopup(`<b>${name}</b><br>Positive migration: ${info.positive}<br>Negative migration: ${info.negative}`);
            } else {
                layer.bindPopup(`<b>${name}</b>`);
            }
        }
    }).addTo(map);

    map.fitBounds(geoJson.getBounds());
}

fetchData();