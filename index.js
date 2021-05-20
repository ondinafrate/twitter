// var canvas = document.getElementById('myCanvas');
// var ctx = canvas.getContext('2d');

// const map = (value, x1, y1, x2, y2) => (value - x1) * (y2 - x2) / (y1 - x1) + x2;

// function setup (){
//     loadData();
// }

// function draw(){
// }

// var min, max;

function loadData(){
    fetch("./data1.json")
    .then(response => {
       return response.json();
    })
    .then(data => {
        var hashtags = {};
        data.forEach((tweet) => {
            tweet.hashtags.forEach(tag => {
                if(hashtags[tag]){
                    hashtags[tag] += 1;
                } else {
                    hashtags[tag] = 1;
                }
            })
        })
        var sortable = [];
        for (var tag in hashtags) {
            sortable.push([tag, hashtags[tag]]);
        }

        sortable.sort(function(a, b) {
            return b[1] - a[1];
        });
        console.log(sortable)
        console.log(data)
    });
        
}
// loadData();


// setup();


// set the dimensions and margins of the graph
var margin = {top: 0, right: 30, bottom: 100, left: 100},
  width = 1000 - margin.left - margin.right,
  height = 600 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3.select("#my_dataviz")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

// Read dummy data
d3.json("./data1.json", function( data) {
    // data = data.slice(0, 1000)
    const newData = {
        nodes: [

        ],
        links: [

        ]
    }

    const newNodes = {}

    const newLinks = {}

    data.forEach((tweet) => {
        tweet.hashtags.forEach(tag => {
            if(newNodes[tag]){
                newNodes[tag].n += 1;
                // newNodes[tag].grp += tweet.hashtags.length-1;
                newNodes[tag].connections += tweet.hashtags.length-1;
            } else {
                newNodes[tag] = {
                    "name": tag,
                    "n": 1,
                    "grp": 1,
                    "id": tag,
                    "connections": tweet.hashtags.length-1
                };
            }

            if(newLinks[tag]){
                newLinks[tag] = new Set([...newLinks[tag], ...tweet.hashtags])
            } else {
                newLinks[tag] = new Set(tweet.hashtags);
            }
        })
    });

    const connections = {...newLinks}

    const filterNodes = new Set();
    const filteredNodes = _.filter(Object.values(newNodes), node => {
        if(node.connections > 2){
            filterNodes.add(node.id)
            return true;
        } else {
            return false;
        }
    });

    newData.nodes = filteredNodes;

    filteredNodes.forEach(node => {
        let key = node.id;

        newLinks[key].forEach(target => {
            if(key !== target && filterNodes.has(target)){
                newData.links.push({
                    "source": key,
                    target,
                    "value": 1
                })
                // if(newLinks[target].has(key)){
                //     newLinks[target].delete(key);
                // }
            }
        })
    })

    // Object.keys(newLinks).forEach(key => {
    //     newLinks[key].forEach(target => {
    //         if(key !== target && filterNodes.has(target) && filterNodes.has(key)){
    //             newData.links.push({
    //                 "source": key,
    //                 target,
    //                 "value": 1
    //             })
    //             // if(newLinks[target].has(key)){
    //             //     newLinks[target].delete(key);
    //             // }
    //         }
    //     })
    // })

    console.log(newData)

    data = newData;

  // List of node names
  var allNodes = data.nodes.map(function(d){return d.name})

  // List of groups
  var allGroups = data.nodes.map(function(d){return d.grp})
  allGroups = [...new Set(allGroups)]

  // A color scale for groups:
  var color = d3.scaleOrdinal()
    .domain(allGroups)
    .range(d3.schemeSet3);

  // A linear scale for node size
  var size = d3.scaleLinear()
    .domain([1,10])
    .range([2,10]);

  // A linear scale to position the nodes on the X axis
  var x = d3.scalePoint()
    .range([0, width])
    .domain(allNodes)

  // In my input data, links are provided between nodes -id-, NOT between node names.
  // So I have to do a link between this id and the name
  var idToNode = {};
  data.nodes.forEach(function (n) {
    idToNode[n.id] = n;
  });

  // Add the links
  var links = svg
    .selectAll('mylinks')
    .data(data.links)
    .enter()
    .append('path')
    .attr('d', function (d) {
      start = x(idToNode[d.source].name)    // X position of start node on the X axis
      end = x(idToNode[d.target].name)      // X position of end node
      return ['M', start, height-30,    // the arc starts at the coordinate x=start, y=height-30 (where the starting node is)
        'A',                            // This means we're gonna build an elliptical arc
        (start - end)/2, ',',    // Next 2 lines are the coordinates of the inflexion point. Height of this point is proportional with start - end distance
        (start - end)/2, 0, 0, ',',
        start < end ? 1 : 0, end, ',', height-30] // We always want the arc on top. So if end is before start, putting 0 here turn the arc upside down.
        .join(' ');
    })
    .style("fill", "none")
    .attr("stroke", "grey")
    .style("stroke-width", 1)

  // Add the circle for the nodes
  var nodes = svg
    .selectAll("mynodes")
    .data(data.nodes.sort(function(a,b) { return +b.n - +a.n }))
    .enter()
    .append("circle")
      
      .attr("cx", function(d){ return(x(d.name))})
      .attr("cy", height-30)
      .attr("r", function(d){ return(size(d.n))})
      .style("fill", function(d){ return color(d.grp)})
      .attr("stroke", "white")

  // And give them a label
  var labels = svg
    .selectAll("mylabels")
    .data(data.nodes)
    .enter()
    .append("text")
      .attr('id', d => d.id)
      .attr("x", 0)
      .attr("y", 0)
      .text(function(d){ return(d.name)} )
      .style("text-anchor", "end")
      .attr("transform", function(d){ return( "translate(" + (x(d.name)) + "," + (height-15) + ")rotate(-45)")})
      .style("font-size", 6)

  // Add the highlighting functionality
  nodes
    .on('mouseover', function (d) {
      // Highlight the nodes: every node is green except of him
      nodes
        .style('opacity', .2)
      d3.select(this)
        .style('opacity', 1)

      
      // Highlight the connections
      links
        .style('stroke', function (link_d) { return link_d.source === d.id || link_d.target === d.id ? color(d.grp) : '#b8b8b8';})
        .style('stroke-opacity', function (link_d) { return link_d.source === d.id || link_d.target === d.id ? 1 : .2;})
        .style('stroke-width', function (link_d) { return link_d.source === d.id || link_d.target === d.id ? 4 : 1;})
      labels
        .style("font-size", function(label_d){ return label_d.name === d.name ? 16 : 2 } )
        .attr("y", function(label_d){ return label_d.name === d.name ? 10 : 0 } )

        connections[d.id].forEach(target => {
            if(d.id !== target){
                d3.select("#" + target)
                .style("font-size", function(label_d){ return 12 } )
                .attr("y", function(label_d){ return 12 } );
            }
        })
    })
    .on('mouseout', function (d) {
      nodes.style('opacity', 1)
      links
        .style('stroke', 'grey')
        .style('stroke-opacity', .8)
        .style('stroke-width', '1')
      labels
        .style("font-size", 6 )

    })
})

