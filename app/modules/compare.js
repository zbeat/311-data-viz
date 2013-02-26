define([
  // Application.
  "app"
],

// Map dependencies from above array.
function(app) {

  // Create a new module.
  var Compare = app.module();

  // Default model.
  Compare.Model = Backbone.Model.extend({
    successCallback: function(model, response) {
      model.trigger("loaded", model);
    },

    errorCallback: function(model, response) {
      console.log(response);
    },

    _ready: function() {
      if (undefined !== this.get("stats")) {
        return true;
      }

      return false;
    },

    avgDaysToCloseRequests: function() {
      if (this._ready()) {
        return Math.round(this.get("stats").days_to_close_requests_avg);
      }
    },

    mostFrequentTime: function() {
      if (this._ready()) {
        var stats = this.get("stats");
        var timeCounts = [
          {name: "Morning", frequency: stats.request_time_bins.morning},
          {name: "Afternoon", frequency: stats.request_time_bins.afternoon},
          {name: "Night", frequency: stats.request_time_bins.night}
        ];
        var max = _.max(timeCounts, function(timeCount) {return timeCount.frequency;});
        if (max) {
          return max.name;
        }
        return "";
      }
    },

    mostFrequentDay: function() {
      if (this._ready()) {
        var stats = this.get("stats");
        var dayCounts = [
          {name: "Saturday", frequency: stats.request_time_bins.days.saturday},
          {name: "Sunday", frequency: stats.request_time_bins.days.sunday},
          {name: "Monday", frequency: stats.request_time_bins.days.monday},
          {name: "Tuesday", frequency: stats.request_time_bins.days.tuesday},
          {name: "Wednesday", frequency: stats.request_time_bins.days.wednesday},
          {name: "Thursday", frequency: stats.request_time_bins.days.thursday},
          {name: "Friday", frequency: stats.request_time_bins.days.friday}
        ];
        var max = _.max(dayCounts, function(dayCount) {return dayCount.frequency;});
        if (max) {
          return max.name;
        }
        return "";
      }
    },

    topRequests: function(n) {
      if (this._ready()) {
        var stats = this.get("stats");
        return _.first(stats.request_counts, n);
      }

      return _.range(n);
    },

    topRequestsPercentages: function(n) {
      var ret = _.range(n);

      if (this._ready()) {
        var stats = this.get("stats");
        var counts = _.first(_.pluck(stats.request_counts, 'count'), n);
        var sum = _.reduce(counts, function(memo, num) { return memo + num; }, 0);
        if (0 === sum) {
          return ret;
        }
        ret = _.map(counts, function(num) { return Math.round((num / sum) * 100); });
      }

      return ret;
    },

    requestPercentageOfTotal: function(requestType) {
      var stats = this.get("stats");
      var counts = _.pluck(stats.request_counts, 'count');
      var sum = _.reduce(counts, function(memo, num) { return memo + num; }, 0);
      if (0 === sum) {
        return {};
      }
      var request = _.find(stats.request_counts, function (count) { return count.type === requestType; });

      return {percentage: request.count / sum, count: request.count, outOf: sum};
    }
  });

  Compare.Views.Area = Backbone.View.extend({
    template: "compare/area",
    id: "area",

    afterRender: function() {
      var modelAPercentages = this.model.modelA.topRequestsPercentages(5);
      var modelBPercentages = this.model.modelB.topRequestsPercentages(5);
      var maximumWidth = 600;

      var modelAWidths = _.map(modelAPercentages, function(num) {
        return Math.round((num / 100) * maximumWidth);
      });
      var modelBWidths = _.map(modelBPercentages, function(num) {
        return Math.round((num / 100) * maximumWidth);
      });

      this._adjustChart(".sr-top-1-left", ".sr-top-1-right", modelAWidths, modelBWidths, 0);
      this._adjustChart(".sr-top-2-left", ".sr-top-2-right", modelAWidths, modelBWidths, 1);
      this._adjustChart(".sr-top-3-left", ".sr-top-3-right", modelAWidths, modelBWidths, 2);
      this._adjustChart(".sr-top-4-left", ".sr-top-4-right", modelAWidths, modelBWidths, 3);
      this._adjustChart(".sr-top-5-left", ".sr-top-5-right", modelAWidths, modelBWidths, 4);
    },

    _adjustChart: function(leftDivClass, rightDivClass, modelAWidths, modelBWidths, index) {
      $(leftDivClass).css("width", modelAWidths[index] + "px");
      $(leftDivClass).css("margin-left", 250-modelAWidths[index] + "px");
      $(rightDivClass).css("width", modelBWidths[index] + "px");
      $(rightDivClass).css("margin-right", 210 + (250 - modelBWidths[index]) + "px");
      $('vert').css("height", 1200);
    },

    serialize: function () {
      console.log("Compare.Views.Area serialize: this.model: %o", this.model); //FIXME:remove
      return {
        data_loaded: this.model.modelA.get("ward") != "undefined" && this.model.modelB.get("ward") != "undefined",
        modelA_ward: this.model.modelA.get("ward"),
        modelA_stats: this.model.modelA.get("stats"),
        modelA_avgDays: this.model.modelA.avgDaysToCloseRequests(),
        modelA_freqTime: this.model.modelA.mostFrequentTime(),
        modelA_freqDay: this.model.modelA.mostFrequentDay(),
        modelB_ward: this.model.modelB.get("ward"),
        modelB_stats: this.model.modelB.get("stats"),
        modelB_avgDays: this.model.modelB.avgDaysToCloseRequests(),
        modelB_freqTime: this.model.modelB.mostFrequentTime(),
        modelB_freqDay: this.model.modelB.mostFrequentDay(),
        modelA_top5Requests: this.model.modelA.topRequests(5),
        modelB_top5Requests: this.model.modelB.topRequests(5),
        modelA_top5RequestPercentages: this.model.modelA.topRequestsPercentages(5),
        modelB_top5RequestPercentages: this.model.modelB.topRequestsPercentages(5),
        modelA_allRequests: this.model.modelA.topRequests(14),
        modelB_allRequests: this.model.modelB.topRequests(14)
      };
    },

    initialize: function() {
      // XXX: "off"s should be in cleanup but cannot due to multiple loads of view stack by router
      this.model.modelA.off("change");
      this.model.modelA.on("change", this.render, this);
      this.model.modelB.off("change");
      this.model.modelB.on("change", this.render, this);
    }
  });

  Compare.Views.Compare = Backbone.View.extend({
    template:"compare/base",
    tagName:"div",
    id:"compare",

    modelA: new Compare.Model({ward:this.first}),
    modelB: new Compare.Model({ward:this.second}),

    events: {
      "change #slAreaA" : function(e) {
        this.loadDataForArea(this.modelA, e.currentTarget.value);
        app.router.navigate("/compare/" + e.currentTarget.value + "-" + this.modelB.get('ward'));
      },
      "change #slAreaB" : function(e) {
        this.loadDataForArea(this.modelB, e.currentTarget.value);
        app.router.navigate("/compare/" + this.modelA.get('ward') + "-" + e.currentTarget.value);
      },
      "change #slServiceRequest" : function(e) {
        var selected = $("#slServiceRequest :selected").text();
        $('#compare-service-type').text(selected);
        var modelAPercentage = this.modelA.requestPercentageOfTotal(selected);
        var modelBPercentage = this.modelB.requestPercentageOfTotal(selected);

        $('#percentage-left').text(Math.round(100 * modelAPercentage.percentage) + '%');
        $('#percentage-right').text(Math.round(100 * modelBPercentage.percentage) + '%');
        $('#counts-left').text('(' + modelAPercentage.count + '/' + modelAPercentage.outOf + ')');
        $('#counts-right').text('(' + modelBPercentage.count + '/' + modelBPercentage.outOf + ')');


      }
    },

    loadDataForArea: function(_model, area){
      _model.url = "http://chicagoworks-api.herokuapp.com/api/v1/" +
        area +
        "/summary?start=2004-09-01&end=" + 
        this.currentDateString() + "&callback=?";
      _model.fetch({success: _model.successCallback, error: _model.errorCallback});
    },

    currentDateString: function(){
      // return the date in format: yyyy-mm-dd
      // for use in comparison queries to API
      d = new Date();
      year = d.getUTCFullYear();
      month = d.getUTCMonth() + 1; // zero-indexed
      day = d.getUTCDate();
      
      return year + "-" + month + "-" + day;
    }, 

    beforeRender: function(ev) {
      this.insertView(".areas", new Compare.Views.Area({
        model: {modelA: this.modelA, modelB: this.modelB}
      }));
      this.loadDataForArea(this.modelA, this.first);
      this.loadDataForArea(this.modelB, this.second);      
    },

    afterRender: function(ev) {},

    cleanup: function() {
      this.stats.off(null, null, this);
      app.off(null, null, this);
    },

    serialize: function() {
      var areas = [];
      
      // 50 wards are our areas for now...
      for (var i=1; i<=50; i++) {
        areas.push({area:i, isSelectedA: i == this.first, isSelectedB: i == this.second });
      }

      console.log("serialize returning: %o", {
        stats: this.stats,
        areas: areas,
        first: this.first,
        second: this.second
      }); // FIXME:remove

      return {
        stats: this.stats,
        areas: areas,
        first: this.first,
        second: this.second
      };
    },

    initialize: function(o) {
      console.log("Compare.Views.Compare initialize: o is %o", o); //FIXME: remove
      this.first = o.first;
      this.second = o.second;
      this.filters = o.filters;
      this.stats = o.stats;
      this.stats.on("reset", this.render, this);
      this.stats.on("change", this.render, this);
      this.stats.on("add", this.render, this);
      app.on("show_filters", function(){$("#content").addClass("sidebar");}, this);
      app.on("show_nav", function(){$("#content").removeClass("sidebar");}, this);
    }
  });

  // Return the module for AMD compliance.
  return Compare;

});
