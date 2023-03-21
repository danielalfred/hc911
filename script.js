class hc911 {
  constructor() {
    this.refreshButton().addEventListener("click", (ev) => {
      this.refreshCalls();
      this.populateCalls();
    });
    this.homeText().value = localStorage.getItem("home-text") ?? "";
    this.setHomeButton().addEventListener("click", (ev) => {
      this.submitHomeText();
    });
    this.clearHomeButton().addEventListener("click", (ev) => {
      this.homeText().value = "";
      localStorage.removeItem("home-text");
      localStorage.removeItem("homeLat");
      localStorage.removeItem("homeLong");
    });
    this.homeForm().addEventListener("submit", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      this.submitHomeText();
    });
    if(!localStorage.getItem("calls"))
     //|| localStorage.getItem("lastRefresh") < new Date() - 1000 * 5) {
     {
	    this.refreshCalls();
     }
    this.populateCalls();
  }

  submitHomeText() {
      let homeText = this.homeText().value;
      this.getGeocode(homeText);
  }

  addMessage(text, level) {
    let message = document.createElement("p");
    message.className = "message" + level ? " " + level : "";
    message.append(text);
    this.messages().append(message);
  }

  refreshButton() {
    return document.getElementById("refresh-button");
  }

  homeForm() {
    return document.getElementById("home-form");
  }

  homeText() {
    return document.getElementById("home-text");
  }

  setHomeButton() {
    return document.getElementById("set-home-button");
  }

  clearHomeButton() {
    return document.getElementById("clear-home-button");
  }

  calllist() {
    return document.getElementById("calls");
  }

  refreshCalls() {
    localStorage.setItem("lastRefresh", Date.UTC);
    let xhr = new XMLHttpRequest();
    xhr.open("GET", "https://hc911server.com/api/calls", true);
    xhr.onload = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200)
		      localStorage.setItem("calls", xhr.responseText);
	    } else {
	      console.error(xhr);
	    }
    };
    xhr.onerror = (e) => {
	    console.error(xhr.statusText);
    };
    xhr.send(null);
  }
  
  clearCalls() {
    while(this.calllist().firstChild)
    {
      this.calllist().removeChild(this.calllist().firstChild);
    }
  }

  populateCalls() {
    this.clearCalls();
    let callsJson = localStorage.getItem("calls");
    var calls = JSON.parse(callsJson);
    if(localStorage.getItem("home-text")) {
      calls.sort(this.sortByDistance);
    } else {
      calls.sort((a, b) => { return a.priority - b.priority; });
    }
    calls.forEach(call => {
      let li = document.createElement("li");
      li.innerHTML = this.getCallMarkup(call);
	    this.calllist().append(li);
    });
  }

  getAddressMarkup(premise, address = premise, city, state, crossstreets) {
    return `
      <p class="address">
        <span>${premise}</span>
        <span class="crossstreets">${crossstreets}</span>
        <span>${premise.toLowerCase() != address.toLowerCase() ? address : ""}</span> 
        <span>${city}${state ? ", " + state : ""}</span>
      </p>
    `;
  }

  getCallMarkup(call)
  {
    return `
      <h3>${call.type_description}</h3>
      <p class="created">
        Created ${new Date(call.creation).toLocaleTimeString()}</p>
      <p>
        ${call.priority.length > 0
          ? "<span class=\"priority\">" + call.priority + "</span>"
          : ""} 
        <span class="status">${call.status}
        ${call.statusDateTime
            ? "as of " + new Date(call.statusdatetime).toLocaleTimeString()
            : ""}</span>
      </p> 
      ${this.getAddressMarkup(call.premise, call.address, call.city, call.state, call.crossstreets)}
      <p class="responder">
          <span class="agency">${call.agency_type}</span>
          <span class="jurisdiction">${call.jurisdiction}</span>
          <span class="battalion">${call.battalion}</span>
      </p>
    `;
  }

  getGeocode(address) {
    let url = "https://maps.googleapis.com/maps/api/geocode/json?";
    var params = {
      key: "AIzaSyBFLXNicIavfVuZQnoyJXk63l8EtisrjdI",
      bounds: "34.89,-85.49%7C35.46,-84.80",
      address: address
    }
    var queryString = new URLSearchParams(params);
    url += queryString.toString();

    let xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onload = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          let response = JSON.parse(xhr.responseText);
          if(response.status == "OK") {
            localStorage.setItem("homeLat", response.results[0].geometry.location.lat);
            localStorage.setItem("homeLong", response.results[0].geometry.location.lng);
            localStorage.setItem("home-text", response.results[0].formatted_address);
            this.homeText().value = localStorage.getItem("home-text") ?? "";
            this.populateCalls();
          } 
        }
	    } else {
        console.log(xhr);
      }
    };
    xhr.onerror = (e) => {
	    console.error(xhr.statusText);
    };
    xhr.send(null);
  }

  sortByDistance(a, b) {
    let homeLog = localStorage.getItem("homeLat");
    let homeLat = localStorage.getItem("homeLong");
    let diffA = Math.abs(homeLog - a.longitude) + Math.abs(homeLat - a.latitude);
    let diffB = Math.abs(homeLog - b.longitude) + Math.abs(homeLat - b.latitude);
    return diffB - diffA;
  }
}

window.onload = () => {
  new hc911();
};