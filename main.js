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

function newsCompareHandler (){
    clickSubmit ();
    clickSeeMore ();
    clickSeeLess ();
    clickSeeComments ();
    clickHideComments ();
}

function clickSubmit () {
    $('form').submit(event => {
        event.preventDefault();
        let searchTerm = $('#search').val();
        if (searchTerm !== '') {
            fetchData (searchTerm, getDate());
            hideWelcomeContent ();
        }
        else {
            alert('Please enter a search term');
        }
    })
}

function hideWelcomeContent () {
    $('.welcome').addClass('hidden');
}

function fetchData (searchTerm, lastMonthdate) {
    console.log('test');
    var settings = {
        "async": true,
        "crossDomain": true,
        "url": `https://api-hoaxy.p.mashape.com/articles?sort_by=relevant&use_lucene_syntax=true&query=${searchTerm}`,
        "method": "GET",
        "headers": {
          "Accept": "application/json",
          "X-Mashape-Key": "TcWIAYm5YCmsh3fBLAJ3Rz05FOxHp1sBjoDjsnV01p5E4gGfIp"
        }
      }
      
      $.ajax(settings).done(function (response) {
        let factNewsData = response;
        displayFactCheckNews(factNewsData);
      });
        
    var settings = {
        "async": true,
        "crossDomain": true,
        "url": `https://newsapi.org/v2/everything?apiKey=ba81d44e6d054cc9b78df51ce86a46f0&domains=wsj.com,nytimes.com,cnn.com,huffingtonpost.com,foxnews.com,usatoday.com,%20npr.org,%20nbcnews.com,%20cbsnews.com,%20abcnews.com,%20newsweek.com%20&q=${searchTerm}&from=${lastMonthdate}&sortBy=publishedAt`,
        "method": "GET"
        };
        
        $.ajax(settings).done(function (newsResponse) {
        let mainMediaData = newsResponse;
        displayMainNews(mainMediaData);
        });

    var settings = {
        "async": true,
        "crossDomain": true,
        "url": `https://newsapi.org/v2/everything?from=${lastMonthdate}&apiKey=ba81d44e6d054cc9b78df51ce86a46f0&domains=wnd.com,redstate.com,alternet.org,breitbart.com,infowar.com&q=${searchTerm}&sortBy=publishedAt`,
        "method": "GET"
        };
    
    $.ajax(settings).done(function (altNewsresponse) {
    displayAltNews(altNewsresponse);
    });

    var settings = {
        "async": true,
        "crossDomain": true,
        "url": `https://api.pushshift.io/reddit/search/comment/?q=${searchTerm}&after=24h&aggs=link_id&size=0`,
        "method": "GET"
    };
    
    $.ajax(settings).done(function (popularRedditsData) {
        let length = popularRedditsData['aggs']['link_id'].length;
        if (length !== 0) {
            let redditArray = getRelevantData (popularRedditsData);
            getCommentsForRedditData (redditArray, searchTerm);
        }
        else {$('.comments-results').html(`<li>No Results</li>`)}

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
    return `${year}-${month}-${day}`;
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
        altArticlesHTML += `<li><h3><a target="_blank" href="${url}">${title}</a></h3><p>${name}</p></li>`;
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
    let articleHTML = '';
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
            let description = articles[i]['description'];                                                               /*change this link to a question mark img*/
            articleHTML += `<li><h3><a target=_blank href="${url}">${title}</a></h3><p>${source} | ${biasDescription}   <a target="_blank" href="faq.html" alt="FAQ Page">?</a></p><p>${credibilityDescriptor}</p><div class="seeMore-js"><p class="viewer">See More</p><p class="description hidden">${description}</p></div></li>`;
        }
    }

    return articleHTML;
}

function biasScore(source) {
    let biasDescriptor = '';
    Object.keys(biasData).forEach(bias => {
        if (source === bias) {
            biasNum = biasData[bias][0];
            if (biasNum>-6 & biasNum<6) {
                biasDescriptor = "Bias: Center"
            }
            else if (biasNum > -19 & biasNum <-5) {
                biasDescriptor = "Bias: Leans Left";
            }
            else if (biasNum > -31 & biasNum < -18) {
                biasDescriptor = "Bias: Hyper Left";
            }
            else if (biasNum > 5 & biasNum < 19) {
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
                credibilityDescriptor = "Credibility: Original fact reporting";
            }
            else if (credibilityNum < 56 & credibilityNum > 47) {
                credibilityDescriptor = "Credibility: Fact reporting";
            }
            else if (credibilityNum < 48 & credibilityNum > 39) {
                credibilityDescriptor = "Credibility: Mix of fact reporting and opinion";
            }
            else if (credibilityNum < 40 & credibilityNum > 31) {
                credibilityDescriptor = "Credibility: Less reliant on original fact reporting; ";
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

function getRelevantData (popularRedditsData) {
    let redditDataArray = [];
    let num = 6;
    if (popularRedditsData['aggs']['link_id'].length < 5) {
        num = popularRedditsData['aggs']['link_id'].length;
    }
    for (let i=0; i<num; i++){
        let popularReddits = popularRedditsData['aggs']['link_id'][i]['data'];
        let redditData = {
        newsSite: popularReddits['domain'],
        redditLink: popularReddits['full_link'],
        redditId: popularReddits['id'],
        newsTitle: popularReddits['title'],
        newsSiteUrl: popularReddits['url']
        }
        redditDataArray.push(redditData);
    }
    return redditDataArray;
}

function getCommentsForRedditData (redditArray, searchTerm) {
    let allComments = [];
    let recursiveRedditArray = redditArray.slice();
    getComments(allComments, recursiveRedditArray, searchTerm, redditArray);
}

function getComments (allComments, recursiveRedditArray, searchTerm, redditArray) {
    if (recursiveRedditArray.length !== 0) {
        var settings = {
            "async": true,
            "crossDomain": true,
            "url": `https://api.pushshift.io/reddit/search/comment/?link_id=${recursiveRedditArray[0]['redditId']}&q=${searchTerm}`,
            "method": "GET",
        }
        
        $.ajax(settings).done(function (comments) {
            let commentArray = getRelevantCommentInfo (comments);
            allComments.push(commentArray);
            recursiveRedditArray.shift();
            getComments(allComments, recursiveRedditArray, searchTerm, redditArray);
        });
    }
    else {
        displayallComments (allComments, redditArray);
    }
}

function displayallComments (allComments, redditArray) {
    /*{username: "cabbage_peddler", comment: "Odds are Trump doesn’t even know he’s an asset. The embodiment of a useful idiot. "}
    newsSite: "nymag.com", redditLink: "https://www.reddit.com/r/politics/comments/af8pb4/robert_mueller_is_investigating_president_trump/", redditId: "af8pb4", NewsTitle: "Robert Mueller Is Investigating President Trump as a Russian Asset", newsSiteUrl: "http://nymag.com/intelligencer/2019/01/mueller-investigating-trump-russian-asset.html"}*/
    let commentHTML = '';
    for  (let i=0; i<redditArray.length; i++) {
        commentHTML += `<li><h3>${redditArray[i]['newsTitle']}</h3>
                    <p>Source: ${redditArray[i]['newsSite']} <a target="_blank" href="${redditArray[i]['newsSiteUrl']}">View orginal article</a></p><div class="see-comments-js"><p class="comments-view-js">See Comments</p><div class="comments-js hidden">`
        for (let j=0; j<allComments[i].length; j++) {
            commentHTML += `<div class="each-comment"><p>Username: ${allComments[i][j]['username']}</p><p>\t${allComments[i][j]['comment']}<a href="${redditArray[i]['redditLink']}">See comment in original context</a></p></div>`;
        }
    commentHTML += '</div></div></li>';
    }
    $('.comments-results').html(commentHTML);
    revealResults ();
}

function getRelevantCommentInfo (comments) {
    let commentArray = [];
    let num = 5;
    for (let i=0; i<num; i++) {
        let test = comments['data'].length;
        if (i<test) {
            let commentInfo = comments['data'][i];
            if (commentInfo['body'].length < 350) {
                let commentObject = {
                    username: commentInfo['author'],
                    comment: commentInfo['body']
                }
                commentArray.push(commentObject)
            }
            else {
                num++
            }
        }
    }
    return commentArray;
}

function revealResults () {
    $('.results').removeClass('hidden');
}

function clickSeeMore () {
    $('.result-div-js').on('click','.seeMore-js', event => {
        $(event.currentTarget).find('.description').removeClass('hidden');
        $(event.currentTarget).find('.viewer').text('See Less');
        $(event.currentTarget).removeClass('seeMore-js');
        $(event.currentTarget).addClass('seeLess-js');
        console.log('testclick');
    })
}

function clickSeeLess () {
    $('.result-div-js').on('click','.seeLess-js', event => {
        $(event.currentTarget).find('.description').addClass('hidden');
        $(event.currentTarget).find('.viewer').text('See More');
        $(event.currentTarget).removeClass('seeLess-js');
        $(event.currentTarget).addClass('seeMore-js');
        console.log('testclick');
    })
}

function clickSeeComments () {
    $('.result-div-js').on('click','.see-comments-js', event => {
        console.log('test10');
        $(event.currentTarget).find('.comments-js').removeClass('hidden');
        $(event.currentTarget).find('.comments-view-js').text('Hide Comments');
        $(event.currentTarget).removeClass('see-comments-js');
        $(event.currentTarget).addClass('hide-comments-js');
        console.log('test4');
    })
}

function clickHideComments () {
    $('.result-div-js').on('click','.hide-comments-js', event => {
        $(event.currentTarget).find('.comments-js').addClass('hidden');
        $(event.currentTarget).find('.comments-view-js').text('See Comments');
        $(event.currentTarget).removeClass('hide-comments-js');
        $(event.currentTarget).addClass('see-comments-js');
    })
}

$(newsCompareHandler);