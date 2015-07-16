require([
  'jquery',
  'g_config',
  'leaflet',
  '//veltman.github.io/wherewolf/wherewolf.js'],
  function ($, g_config, leaflet, Wherewolf) {

    //GLOBAL VARS
    var map, pending, marker, members, geocoder, house_members, senate_members, congress_members;

    //BEGIN LEAFLET
    leaflet.done(function (L) {
        map = new L.Map('map', {center: new L.LatLng(35.1779935,-79.7731005), zoom:7, scrollWheelZoom: false, zoomControl: false});
        L.tileLayer('http://{s}.tile.stamen.com/toner-lite/{z}/{x}/{y}.png', {maxZoom: 13,}).addTo(map);
        map.attributionControl.setPrefix('');
        map.dragging.disable();

      //INITIALIZE GEOCODER
      geocoder = new google.maps.Geocoder();
    });
    //END LEAFLET

    //JSON LOAD FOR SHAPES
    var nc_house = (function () {
      var nc_house = null;
      $.ajax({
        'async': true,
        'global': false,
        'url': '/news/state/nccapitol/data_set/14396373/?dsi_id=nc-house&version=jsonObj',
        'dataType': "json",
        'success': function (data) {
          Wherewolf.add("NC House",data);
          nc_house = data;
        }
      });
      return nc_house;
    })();
    var nc_senate = (function () {
      var nc_senate = null;
      $.ajax({
        'async': true,
        'global': false,
        'url': '/news/state/nccapitol/data_set/14396379/?dsi_id=nc-senate&version=jsonObj',
        'dataType': "json",
        'success': function (data) {
          Wherewolf.add("NC Senate",data);
          nc_senate = data;
        }
      });
      return nc_senate;
    })();
    var us_house = (function () {
      var us_house = null;
      $.ajax({
        'async': true,
        'global': false,
        'url': '/news/state/nccapitol/data_set/14396381/?dsi_id=us-house&version=jsonObj',
        'dataType': "json",
        'success': function (data) {
          Wherewolf.add("US House",data);
          us_house = data;
        }
      });
      return us_house;
    })();

    //JSON LOAD FOR MEMBERS
    var house_members = (function () {
      $.ajax({
        'async': true,
        'global': false,
        'url': '/news/state/nccapitol/data_set/14376504/?dsi_id=nc-house&version=jsonObj',
        'dataType': "json",
        'success': function (data) {
          house_members = data;
        }
      });
      return house_members;
    })();
    var senate_members = (function () {
      $.ajax({
        'async': true,
        'global': false,
        'url': '/news/state/nccapitol/data_set/14376504/?dsi_id=nc-senate&version=jsonObj',
        'dataType': "json",
        'success': function (data) {
          senate_members = data;
        }
      });
      return senate_members;
    })();
    var congress_members = (function () {
      $.ajax({
        'async': true,
        'global': false,
        'url': 'news/state/nccapitol/data_set/14376504/?dsi_id=us-house&version=jsonObj',
        'dataType': "json",
        'success': function (data) {
          congress_members = data;
        }
      });
      return congress_members;
    })();

    //When they submit an address...
    $("#search-address").on("click",function(){
      //Geocode with Google
      geocoder.geocode({ address: $("#address").val() },function(results, status) {
        var houseDistrict,senateDistrict,lngLat;

        //For each geocoder result
        for (var i = 0; i < results.length; i++) {
          lngLat = {
            lng: results[0].geometry.location.lng(),
            lat: results[0].geometry.location.lat()
          };

          //Check it with wherewolf
          //Return the whole matching feature,
          //not just its properties
          districts = Wherewolf.find(lngLat,{
            wholeFeature: true
          });

          //If it's a match, stop
          if (districts) {
            if (districts["NC House"] == null){
              return showDistrict();
            }
            addressDisplay = results[0].formatted_address;
            return showDistrict(lngLat,districts);
          }
        }

        //No results
        return showDistrict();
      });
      return false;
    });

    function showDistrict(lngLat,district) {
      //If there's a match, display it
      if (district) {
        if (marker != undefined){
          map.removeLayer(marker);
        }
        //Center the map on their location, or the default
        map.setView(lngLat, 13);
        marker = L.marker(lngLat).addTo(map);

        var house_district = district["NC House"].properties["District"];
        $("#address-display").text(addressDisplay);
        $("#ncga-title").css('display', 'block');
        $("#address-display").css('display', 'block');
        $(".nc-house").css('display', 'inline');
        $(".nc-senate").css('display', 'inline');
        $(".us-house").css('display', 'inline');

        $(".nc-house #district").text("District " + house_district);
        if(house_members[house_district - 1]["member"] == "VACANT"){
          $(".nc-house #name").html(house_members[house_district - 1]["member"]);
          $(".nc-house #headshot").attr("src","http://mtduk.es/sandbox/assets/congress_img/not_found.jpg");
          $(".nc-house #party").text("");
          $(".nc-house #comms").css('display','none');
        }
        else{
          $(".nc-house #name").html("State Rep.<br />" + house_members[house_district - 1]["member"]);
          $(".nc-house #headshot").attr("src",house_members[house_district - 1]["headshot"]);
          $(".nc-house #party").text(house_members[house_district - 1]["party"] + ",");
          $(".nc-house #comms").css('display','inline');
          $(".nc-house #phone").text(house_members[house_district - 1]["phone"]);
          $(".nc-house a#contact").attr('href',"mailto:" + house_members[house_district - 1]["email"]);
        }
        $(".nc-house #counties").text(house_members[house_district - 1]["county_short"]);
        $(".nc-house #headshot").css('margin-right', '10px');
        $(".nc-house #headshot").attr("width","100");

        var sen_district = district["NC Senate"].properties["District"];
        if(senate_members[sen_district - 1]["member"] == "VACANT"){
          $(".nc-senate #name").html(senate_members[sen_district - 1]["member"]);
          $(".nc-senate #headshot").attr("src","http://mtduk.es/sandbox/assets/congress_img/not_found.jpg");
          $(".nc-senate #party").text("");
          $(".nc-senate #comms").css('display','none');         
        }
        else{
          $(".nc-senate #name").html("State Sen.<br />" + senate_members[sen_district - 1]["member"]);
          $(".nc-senate #headshot").attr("src",senate_members[sen_district - 1]["headshot"]);
          $(".nc-senate #party").text(senate_members[sen_district - 1]["party"] + ",");
          $(".nc-senate #comms").css('display','inline');
          $(".nc-senate #phone").text(senate_members[sen_district - 1]["phone"]);
          $(".nc-senate a#contact").attr('href',"mailto:" + senate_members[sen_district - 1]["email"]);     
        }
        $(".nc-senate #district").text("District " + sen_district);
        $(".nc-senate #counties").text(senate_members[sen_district - 1]["county_short"]);
        $(".nc-senate #headshot").css('margin-right', '10px');
        $(".nc-senate #headshot").attr("width","100");

        var cong_district = district["US House"].properties["District"];
        $(".us-house #name").html("U.S. Rep.<br />" + congress_members[cong_district - 1]["member"]);
        $(".us-house #party").text(congress_members[cong_district - 1]["party"] + ", NC-" + cong_district);
        $(".us-house #headshot").css('margin-right', '10px');
        $(".us-house #headshot").attr("src",congress_members[cong_district - 1]["headshot"]);
        $(".us-house #headshot").attr("width","100");
        $(".us-house #phone").text(congress_members[cong_district - 1]["phone"]);
        $(".us-house a#contact").attr('href',congress_members[cong_district - 1]["contact"]);
      }
      //Otherwise clear the map and show "No district found"
      else {
        $("#address-display").text("NC address not found");
        $("#address-display").css('display', 'block');
        $(".nc-house").css('display', 'none');
        $(".nc-senate").css('display', 'none');
        $(".us-house").css('display', 'none');
        $("#ncga-title").css('display', 'none');

        if (marker != undefined){
          //marker.setMap(null);
          map.removeLayer(marker);
          map.setView([35.1779935,-79.7731005], 7);
        }
      }
    }//showDistrict

  });