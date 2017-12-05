
var mapbox_url = "https://api.mapbox.com/styles/v1/coffeeeel/cj9azwnzj4pu52rqel6nfwun3/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiY29mZmVlZWVsIiwiYSI6ImNqOTN1NnNyNTJoZ2QzM25yYmlndXpkdmsifQ.i7hkaH-ATHmP-4xdNosCxQ"
var base_map = new ol.layer.Tile({
    source: new ol.source.XYZ({
        url:mapbox_url
    }),
    title:"basemap"
});
var overviewMapControl = new ol.control.OverviewMap({
    className: 'ol-overviewmap ol-custom-overviewmap',
    layers: [base_map],
    collapseLabel: '\u00BB',
    label: '\u00AB',
    collapsed: true
});

var point_Layer2 = new ol.layer.Tile({
    source: new ol.source.XYZ({
        url: 'https://api.mapbox.com/styles/v1/coffeeeel/cj93ukyy62wdl2so2zdng3duk/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiY29mZmVlZWVsIiwiYSI6ImNqOTN1NnNyNTJoZ2QzM25yYmlndXpkdmsifQ.i7hkaH-ATHmP-4xdNosCxQ',

    }),
    title:"BOHAI_201708POINT",
    visible:false,
})

var point_Layer = new ol.layer.Tile({
    title:'BOHAI_201708',
    visible:false,
    source: new ol.source.TileWMS({
        url: 'http://localhost:8081/geoserver/test/wms',
        params: {
            'LAYERS': 'test4',
            'TILED': true
            // 'z-index': '999',
        },
        serverType: 'geoserver'
    })
});
var vector = new ol.layer.Vector( { source: new ol.source.Vector() });

var map = new ol.Map
({
    controls: ol.control.defaults().extend([
        overviewMapControl,
        new ol.control.FullScreen(),
        new ol.control.MousePosition({
            coordinateFormat: ol.coordinate.createStringXY(2),
            projection: 'EPSG:4326',
            className: 'custom-mouse-position',
            target: document.getElementById('mouse-position')
        }),
        new ol.control.ZoomSlider(),
        new ol.control.ZoomToExtent({
            extent: [13428000, 4800000,
                13260000, 4550000]
        }),
        new ol.control.ScaleLine(),
        new ol.control.LayerPopup()
    ]),
    target: 'map',
    layers: [base_map,point_Layer,point_Layer2,vector],
    view: new ol.View({
        center:ol.proj.transform([120.5,39],"EPSG:4326","EPSG:3857"),
        zoom: 8.0,
        projection:'EPSG:3857'
    }),
});


// Main control bar
var mainbar = new ol.control.Bar();
map.addControl(mainbar);
mainbar.setPosition("top-right");

// Edit control bar
var editbar = new ol.control.Bar(
    {	toggleOne: true,	// one control active at the same time
        group:false			// group controls together
    });
mainbar.addControl(editbar);

// Add selection tool:
//  1- a toggle control with a select interaction
//  2- an option bar to delete / get information on the selected feature
var sbar = new ol.control.Bar();
sbar.addControl (new ol.control.TextButton(
    {	html: '<i class="fa fa-times"></i>',
        title: "Delete",
        handleClick: function()
        {	var features = selectCtrl.getInteraction().getFeatures();
            if (!features.getLength()) info("Select an object first...");
            else info(features.getLength()+" object(s) deleted.");
            for (var i=0, f; f=features.item(i); i++)
            {	vector.getSource().removeFeature(f);
            }
            selectCtrl.getInteraction().getFeatures().clear();
        }
    }));
sbar.addControl (new ol.control.TextButton(
    {	html: '<i class="fa fa-info"></i>',
        title: "Show informations",
        handleClick: function()
        {	switch (selectCtrl.getInteraction().getFeatures().getLength())
        {	case 0: info("Select an object first...");
                break;
            case 1:
                var f = selectCtrl.getInteraction().getFeatures().item(0);
                info("Selection is a "+f.getGeometry().getType());
                break;
            default:
                info(selectCtrl.getInteraction().getFeatures().getLength()+ " objects seleted.");
                break;
        }
        }
    }));

var selectCtrl = new ol.control.Toggle(
    {	html: '<i class="fa fa-hand-pointer-o"></i>',
        title: "Select",
        interaction: new ol.interaction.Select (),
        bar: sbar,
        // autoActivate:true,
        // active:true
    });

editbar.addControl ( selectCtrl);

// Add editing tools
var pedit = new ol.control.Toggle(
    {	html: '<i class="fa fa-map-marker" ></i>',
        title: 'Point',
        interaction: new ol.interaction.Draw
        ({	type: 'Point',
            source: vector.getSource()
        })
    });
editbar.addControl ( pedit );

var ledit = new ol.control.Toggle(
    {	html: '<i class="fa fa-share-alt" ></i>',
        title: 'LineString',
        interaction: new ol.interaction.Draw
        ({	type: 'LineString',
            source: vector.getSource(),
            // Count inserted points
            geometryFunction: function(coordinates, geometry)
            {   if (geometry) geometry.setCoordinates(coordinates);
            else geometry = new ol.geom.LineString(coordinates);
                this.nbpts = geometry.getCoordinates().length;
                return geometry;
            }
        }),
        // Options bar associated with the control
        bar: new ol.control.Bar(
            {	controls:[ new ol.control.TextButton(
                {	html: 'undo',
                    title: "Delete last point",
                    handleClick: function()
                    {	if (ledit.getInteraction().nbpts>1) ledit.getInteraction().removeLastPoint();
                    }
                }),
                new ol.control.TextButton(
                    {	html: 'Finish',
                        title: "finish",
                        handleClick: function()
                        {	// Prevent null objects on finishDrawing
                            if (ledit.getInteraction().nbpts>2) ledit.getInteraction().finishDrawing();
                        }
                    })
            ]
            })
    });

editbar.addControl ( ledit );

var fedit = new ol.control.Toggle(
    {	html: '<i class="fa fa-bookmark-o fa-rotate-270" ></i>',
        title: 'Polygon',
        interaction: new ol.interaction.Draw
        ({	type: 'Polygon',
            source: vector.getSource(),
            // Count inserted points
            geometryFunction: function(coordinates, geometry)
            {   this.nbpts = coordinates[0].length;
                if (geometry) geometry.setCoordinates([coordinates[0].concat([coordinates[0][0]])]);
                else geometry = new ol.geom.Polygon(coordinates);
                return geometry;
            }
        }),
        // Options bar ssociated with the control
        bar: new ol.control.Bar(
            {	controls:[ new ol.control.TextButton(
                {	html: 'undo',//'<i class="fa fa-mail-reply"></i>',
                    title: "undo last point",
                    handleClick: function()
                    {	if (fedit.getInteraction().nbpts>1) fedit.getInteraction().removeLastPoint();
                    }
                }),
                new ol.control.TextButton(
                    {	html: 'finish',
                        title: "finish",
                        handleClick: function()
                        {	// Prevent null objects on finishDrawing
                            if (fedit.getInteraction().nbpts>3) fedit.getInteraction().finishDrawing();
                        }
                    })
            ]
            })
    });
editbar.addControl ( fedit );

// Add a simple push button to save features
var save = new ol.control.Button(
    {	html: '<i class="fa fa-download"></i>',
        title: "Save",
        handleClick: function(e)
        {	var json= new ol.format.GeoJSON().writeFeatures(vector.getSource().getFeatures());
            info(json);
        }
    });
mainbar.addControl ( save );
// Show info
function info(i)
{	$("#info").html(i||"");
}

