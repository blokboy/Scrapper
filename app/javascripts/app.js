// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract'

const ipfsAPI = require('ipfs-api');

//Change for deployment
const ipfs = ipfsAPI({host: 'localhost', port: '5001', protocol: 'http'});

// Import our contract artifacts and turn them into usable abstractions.
import scrapper_artifacts from '../../build/contracts/Scrapper.json'

// MetaCoin is our usable abstraction, which we'll use through the code below.
var Scrapper = contract(scrapper_artifacts);
var reader;

window.App = {
 start: function() {
  var self = this;

  Scrapper.setProvider(web3.currentProvider);

  if($("#photo-details").length > 0) {
    let photoID = new URLSearchParams(window.location.search).get('id');
    renderPhotoDetails(photoID);
  } else {
    renderScrapbook();
  }

  $("#photo-image").change(function(event) {
    const file = event.target.files[0]
    reader = new window.FileReader()
    reader.readAsArrayBuffer(file)
  });


  $("#add-item-to-scrapbook").submit(function(event) {
    const req = $("#add-item-to-scrapbook").serialize();
    let params = JSON.parse('{"' + req.replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}');
    let decodedParams = {};
    Object.keys(params).forEach(function(v) {
      decodedParams[v] = decodeURIComponent(decodeURI(params[v]));
    });
    console.log(decodedParams);
    savePhoto(decodedParams);
    event.preventDefault();
  });

  $("#like-now").submit(function(event) {
    $("#msg").hide();
    var photoID = $("#photo-id").val();
    Scrapper.deployed().then(function(i) {
      i.likePhoto(photoID, {from: web3.eth.coinbase, gas: 270000}).then(
        function(f) {
          $("#msg").show();
          $("#msg").html("Your Like Been Recorded! You can like this photo as many times as you'd like. :)");
        })
      });
      event.preventDefault();
    });

  }
};



function renderPhotoDetails(photoID) {
  Scrapper.deployed().then(function(f) {
    f.getPhoto.call(photoID).then(function(p) {
      $("#photo-name").html(p[3]);
      $("#photo-image").html("<img width='700' src='https://ipfs.io/ipfs/" + p[5] + "' />");
      $("#photo-curator").html(p[0]);
      $("#photo-id").val(p[1]);
      ipfs.cat(p[6]).then(function(file) {
        var content = file.toString();
        $("#photo-desc").append("<div>" + content + "</div>");
      })
    });
  })
}

function savePhoto(photo) {
  var imageId;
  var descId;
  saveImageOnIpfs(reader).then(function(id) {
    imageId = id;
    saveTextBlobOnIpfs(photo["photo-description"]).then(function(id) {
      descId = id;
      Scrapper.deployed().then(function(f) {
        return f.addPhoto(photo["photo-name"], photo["photo-category"], imageId, descId, {from: web3.eth.coinbase, gas: 270000});
      }).then(function(f) {
        alert("Photo added to Scrapbook!");
      });
    });
  });
}

function saveImageOnIpfs(reader) {
  return new Promise(function(resolve, reject) {
    const imgBuffer = Buffer.from(reader.result);
    ipfs.add(imgBuffer).then((response) => {
      console.log(response)
      resolve(response[0].hash);
    }).catch((err) => {
      console.log(err)
      reject(err);
    });
  });
}

function saveTextBlobOnIpfs(blob) {
  return new Promise(function(resolve, reject) {
    const descBuffer = Buffer.from(blob, 'utf-8');
    ipfs.add(descBuffer).then((response) => {
      console.log(response)
      resolve(response[0].hash);
    }).catch((err) => {
      console.log(err)
      reject(err);
    });
  });
}

function renderScrapbook() {
  var instance;
  return Scrapper.deployed().then(function(f) {
    instance = f;
    return instance.photoIndex.call();
  }).then(function(count) {
    for(var i = 1; i <= count; i++) {
      renderPhoto(instance, i);
    }
  })
}

function renderPhoto(instance, index) {
  instance.getPhoto.call(index).then(function(f) {
    let node = $("<div/>");
    node.addClass("col-sm-3 text-center col-margin-bottom-1 photo");
    node.append("<div class='title'>" + f[3]);
    node.append("<img src='https://ipfs.io/ipfs/" + f[5] + "'/>");
    node.append("<div> <span class='icon'><i class='fas fa-heart'></i></span>" + f[2] + "</div>");
    node.append("<a href='photo.html?id=" + f[1] + "'>Details</div>");
    if(f[7] === false) {
      if(f[0] !== web3.eth.coinbase) {
        $("#photo-list").append(node);
      } else {
        $("#photo-purchased").append(node);
      }
    }
  });
}


window.addEventListener('load', function() {
 // Checking if Web3 has been injected by the browser (Mist/MetaMask)
 if (typeof web3 !== 'undefined') {
  console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 MetaCoin, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
  // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider);
 } else {
  console.warn("No web3 detected. Falling back to http://127.0.0.1:9545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
  // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
  window.web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545"));
 }

 App.start();
});
