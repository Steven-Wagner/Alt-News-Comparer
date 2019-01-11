biasData = {
    'The New York Times': -5,
    'The Wall Street Journal': 11,
    'CNN': -6,
    'The Huffington Post': -20,
    'Fox News': 27,
    'USA Today': 0,
    'Npr.org': -5,
    'NBC News': -3,
    'CBS News': 4,
    'MSNBC': -19,
    'Breitbart News': 34,
    'Infowars.com': 44,
    'Redstate.com': 29,
    'Wnd.com': 36,
    'Alternet.org': -23
}

function clickSubmit () {
    $('form').submit(event => {
        event.preventDefault();
        let searchTerm = $('#search').val();
        fetchData (searchTerm);
    })
}

function fetchData (searchTerm) {
    console.log('test');
    var settings = {
        "async": true,
        "crossDomain": true,
        "url": `https://api-hoaxy.p.mashape.com/articles?sort_by=relevant&use_lucene_syntax=true&query=${searchTerm}`,
        "method": "GET",
        "headers": {
          "Accept": "application/json",
          "X-Mashape-Key": "TcWIAYm5YCmsh3fBLAJ3Rz05FOxHp1sBjoDjsnV01p5E4gGfIp",
          "cache-control": "no-cache",
          "Postman-Token": "c364eacd-3d1c-4aa3-aa27-b93cf02f7b9a"
        }
      }
      
      $.ajax(settings).done(function (response) {
        let factNewsData = response;
        displayFactCheckNews(factNewsData);

        let lastMonthdate = getDate();
        
        var settings = {
            "async": true,
            "crossDomain": true,
            "url": `https://newsapi.org/v2/everything?apiKey=ba81d44e6d054cc9b78df51ce86a46f0&domains=wsj.com,nytimes.com,cnn.com,huffingtonpost.com,foxnews.com,usatoday.com,%20npr.org,%20nbcnews.com,%20cbsnews.com,%20abcnews.com,%20newsweek.com%20&q=${searchTerm}&from=${lastMonthdate}&sortBy=publishedAt`,
            "method": "GET",
          }
          
          $.ajax(settings).done(function (newsResponse) {
            let mainMediaData = newsResponse;
            displayMainNews(mainMediaData);
          });

          var settings = {
            "async": true,
            "crossDomain": true,
            "url": `https://newsapi.org/v2/everything?from=${lastMonthdate}&apiKey=ba81d44e6d054cc9b78df51ce86a46f0&domains=wnd.com,redstate.com,alternet.org,breitbart.com,infowar.com&q=${searchTerm}&sortBy=publishedAt`,
            "method": "GET"
          }
          
          $.ajax(settings).done(function (altNewsresponse) {
            displayAltNews(altNewsresponse);
          });
      });
}

function getDate () {
    let date = new Date();
    let day = date.getDate();
    let month = date.getMonth()+1;
    let year = date.getFullYear();
    if (month-1 === 0) {
        month = 12;
        year--;
    }
    else {
        month--;
    }
    currentdate = `${year}-${month}-${day}`;
}

function displayFactCheckNews (altNewsData) {
    factChecks = [];
    altData = altNewsData['articles'];
    for (let i=0; i<altData.length; i++){
        if (factChecks.length<=10){
            if (altData[i]['site_type'] === 'fact_checking') {
                factChecks.push(altData[i]);
            }
        }
        else {
            break;
        }
    }
    let factCheckHTML = HTMLFactNews (factChecks);
    $('.fact-check-results').html(factCheckHTML);
}

function HTMLFactNews (altNews) {
    let altArticlesHTML = '';
    for (let i=0; i<altNews.length; i++) {
        let title = altNews[i]['title'];
        let name = altNews[i]['domain'];
        let url = altNews[i]['canonical_url'];
        altArticlesHTML += `<li><h3>${title}</h3><p>${name}</p><a target="_blank" href="${url}">${url}</a>`;
    }
    return altArticlesHTML;
    
}

function displayMainNews(mainMediaData) {
    let articles = []
    let articlesData = mainMediaData['articles'];
    for (let i=0; i<10; i++) {
        articles.push(articlesData[i])
    }
    let mainArticlesHTML = HTMLNews (articles);
    $('.main-results').html(mainArticlesHTML);
}

function displayAltNews (altNewsresponse) {
    let articles = []
    let articlesData = altNewsresponse['articles'];
    for (let i=0; i<10; i++) {
        articles.push(articlesData[i])
    }
    let altArticlesHTML = HTMLNews (articles);
    $('.alt-results').html(altArticlesHTML);
}

function HTMLNews (articles) {
    articleHTML = '';
    for (let i=0; i<articles.length; i++){
        if (typeof articles[0] == 'undefined') {
            return `<li>No Results Found</li>`;
        }
        else if (typeof articles[i] == 'undefined'){
            return articleHTML;
            }
        else {
            let title = articles[i]['title'];
            let source = articles[i]['source']['name'];
            let biasDescription = biasScore(source);
            let url = articles[i]['url'];
            let description = articles[i]['description'];
            articleHTML += `<li><h3>${title}</h3><p>${source}</p><p>${biasDescription}</p><p>${description}</p><a target="_blank" href="${url}">${url}<a>`;
        }
    }

    return articleHTML;
}

function biasScore(source) {
    let biasDescriptor = '';
    Object.keys(biasData).forEach(bias => {
        if (source === bias) {
            biasNum = biasData[bias];
            if (biasNum>-6 & biasNum<6) {
                biasDescriptor = "Bias: Center"
            }
            else if (biasNum>-11 & biasNum<-5) {
                biasDescriptor = "Bias: Leans Left";
            }
            else if (biasNum>-21 & biasNum<-10) {
                biasDescriptor = "Bias: Partisan Left";
            }
            else if (biasNum>5 & biasNum<11) {
                biasDescriptor = "Bias: Leans Right";
            }
            else if (biasNum>10 & biasNum<21) {
                biasDescriptor = "Bias: Partisan Right";
            }
            else if (biasNum<-20) {
                biasDescriptor = "Bias: Extream Left";
            }
            else if (biasNum>20) {
                biasDescriptor = "Bias: Extream Right";
            }
        }
    })
    return biasDescriptor;
}

$(clickSubmit);