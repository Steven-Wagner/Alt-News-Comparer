biasData = {
    'The New York Times': [-5, 52],
    'The Wall Street Journal': [11, 53],
    'CNN': [-6, 32],
    'The Huffington Post': [-20, 24],
    'Fox News': [17, 47],
    'USA Today': [0, 52],
    'Npr.org': [-5, 56],
    'NBC News': [-3, 57], 
    'CBS News': [4, 57],
    'MSNBC': [-19, 34],
    'Breitbart News': [34, 8],
    'Infowars.com': [44, 1], 
    'Redstate.com': [29, 11],
    'Wnd.com': [36, 4],
    'Alternet.org': [-23, 18]
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
      }).fail();
      
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
            let credibilityDescriptor = credibilityScore(source);
            let url = articles[i]['url'];
            let description = articles[i]['description'];
            articleHTML += `<li><h3>${title}</h3><p>${source}</p><p>${biasDescription}</p><p>${credibilityDescriptor}</p><p>${description}</p><a target="_blank" href="${url}">${url}<a>`;
        }
    }

    return articleHTML;
}

function biasScore(source) {
    let biasDescriptor = '';
    Object.keys(biasData).forEach(bias => {
        if (source === bias) {
            biasNum = biasData[bias][0];
            if (biasNum>-7 & biasNum<7) {
                biasDescriptor = "Bias: Center"
            }
            else if (biasNum > -19 & biasNum <-5) {
                biasDescriptor = "Bias: Leans Left";
            }
            else if (biasNum > -31 & biasNum < -18) {
                biasDescriptor = "Bias: Hyper Left";
            }
            else if (biasNum > 7 & biasNum < 19) {
                biasDescriptor = "Bias: Leans Right";
            }
            else if (biasNum > 18 & biasNum < 31) {
                biasDescriptor = "Bias: Hyper Right";
            }
            else if (biasNum<-30) {
                biasDescriptor = "Bias: Extream Left";
            }
            else if (biasNum>30) {
                biasDescriptor = "Bias: Extream Right";
            }
        }
    })
    return biasDescriptor;
}

function credibilityScore(source) {
    let credibilityDescriptor = '';
    Object.keys(biasData).forEach(newsDomain => {
        if (source === newsDomain) {
            credibilityNum = biasData[newsDomain][1];
            if (credibilityNum > 55) {
                credibilityDescriptor = "Credibility: Original Fact Reporting";
            }
            else if (credibilityNum < 56 & credibilityNum > 47) {
                credibilityDescriptor = "Credibility: Fact Reporting";
            }
            else if (credibilityNum < 48 & credibilityNum > 39) {
                credibilityDescriptor = "Credibility: Mix of fact reporting and opinion";
            }
            else if (credibilityNum < 40 & credibilityNum > 31) {
                credibilityDescriptor = "Credibility: Often provides analysis of news; sometimes stories are second hand from other sources";
            }
            else if (credibilityNum < 32 & credibilityNum > 23) {
                credibilityDescriptor = "Credibility: Often adds opinion/onesided";
            }
            else if (credibilityNum < 24 & credibilityNum > 15) {
                credibilityDescriptor = "Credibility: Unfair reporting/onesided";
            }
            else if (credibilityNum < 16 & credibilityNum > 7) {
                credibilityDescriptor = "Credibility: Propaganda, Misleading info";     
            }
            else if (credibilityNum < 8) {
                credibilityDescriptor = "Credibility: Inaccurate/fabricated Info";
            }
        }
    })
    return credibilityDescriptor;
}

$(clickSubmit);