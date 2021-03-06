biasData = {
    /*index[0] is bias score, [1] is credibility score*/
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
    preventPropigationOnCommentsClick ();
    clickSeeLess ();
    clickSeeComments ();
    clickHideComments ();
}

function clickSubmit () {
    $('form').submit(event => {
        event.preventDefault();
        let searchTerm = $('#search').val();
        if (validateSubmitInput (searchTerm)) {
            fetchData (searchTerm, getDate());
            hideWelcomeContent ();
            displayLoadingIcon();
            $('.nav-links').removeClass('hidden');
        }
    })
}

function validateSubmitInput (searchTerm) {
    if (searchTerm !== '') {
        return true
    }
    else {
        alert('Please enter a search term');
        return false;
    }
}

function hideWelcomeContent () {
    $('.welcome').addClass('hidden');
}

function hideLoading () {
    $('.loading').addClass('hidden');
}

function displayLoadingIcon () {
    $('.loading').removeClass('hidden');
    $('.loading').html(`<img class="loadingIcon" src="https://i.imgur.com/SzrXXSS.png" alt="Loading Icon">`);
}

function fetchData (searchTerm, lastMonthdate) {

    const apiCallForFactCheck = {
        "url": `https://api-hoaxy.p.mashape.com/articles?sort_by=relevant&use_lucene_syntax=true&query=${searchTerm}`,
        "method": "GET",
        "headers": {
          "Accept": "application/json",
          "X-Mashape-Key": "TcWIAYm5YCmsh3fBLAJ3Rz05FOxHp1sBjoDjsnV01p5E4gGfIp"
        }
      }
      
    const factCheckPromise = $.ajax(apiCallForFactCheck).done(function (factNewsData) {
        if (factNewsData["error"] === "No article found!") {
            $('.fact-check-results').html(`<li>No Results</li>`);
        }
        else {
            displayFactCheckNews(factNewsData);
        }
      });
        
    const apiCallMainstreamNews = {
        "url": `https://newsapi.org/v2/everything?apiKey=ba81d44e6d054cc9b78df51ce86a46f0&domains=wsj.com,nytimes.com,cnn.com,huffingtonpost.com,foxnews.com,usatoday.com,%20npr.org,%20nbcnews.com,%20cbsnews.com,%20abcnews.com20&q=${searchTerm}&from=${lastMonthdate}&sortBy=publishedAt`,
        "method": "GET"
        };
        
    const newsPromise = $.ajax(apiCallMainstreamNews).done(function (newsResponse) {
        displayMainNews(newsResponse);
        });

    const apiCallAltNews = {
        "url": `https://newsapi.org/v2/everything?from=${lastMonthdate}&apiKey=ba81d44e6d054cc9b78df51ce86a46f0&domains=wnd.com,redstate.com,alternet.org,breitbart.com,infowar.com&q=${searchTerm}&sortBy=publishedAt`,
        "method": "GET"
        };
    
    const altNewsPromise = $.ajax(apiCallAltNews).done(function (altNewsresponse) {
        displayAltNews(altNewsresponse);
    });

    const apiCallRedditArticles = {
        "url": `https://api.pushshift.io/reddit/search/comment/?q=${searchTerm}&after=24h&aggs=link_id&size=0`,
        "method": "GET"
    };
    
    const redditPromise = $.ajax(apiCallRedditArticles).done(function (popularRedditsData) {
        const length = popularRedditsData['aggs']['link_id'].length;
        if (length !== 0) {
            let redditArray = getRelevantData (popularRedditsData);
            CommentsForRedditData (redditArray, searchTerm);
        }
        else {
            $('.comments-results').html(`<li>No Results</li>`);
            revealResults ();
            hideLoading ();
        }

    });

    Promise.all([factCheckPromise, newsPromise, altNewsPromise, redditPromise]).then(function (any) {
    }).catch(e => {
        hideLoading ();
        alert(`${e['statusText']} Please try again!`);
    })
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
    return `${year}-${month}-${day+1}`;
}

function displayFactCheckNews (factCheckData) {
    factData = factCheckData['articles'];

    const factCheckingArticles = factData.filter(article => {
        return article.site_type === 'fact_checking';
    })

    const factCheckHTML = HTMLFactNews(factCheckingArticles);

    $('.fact-check-results').html(factCheckHTML);
}

function HTMLFactNews (factNews) {

    return factNews.map(factArticle => {
        let title = factArticle.title;
        let name = factArticle.domain;
        let url = factArticle.canonical_url;
        return `<li><h3><a target="_blank" href="${url}">${title}</a></h3><p>${name}</p></li>`;
    }).join("");  
}

function displayMainNews(mainMediaData) {
    let mainArticlesHTML = getHTMLNews (mainMediaData)
    $('.main-results').html(mainArticlesHTML);
}

function getHTMLNews (newsData) {
    let articlesData = newsData['articles'];
    return HTMLNews(articlesData);
}

function displayAltNews (altNewsresponse) {
    let altArticlesHTML = getHTMLNews (altNewsresponse)
    $('.alt-results').html(altArticlesHTML);
}

function HTMLNews (articles) {
    if (typeof articles[0] == 'undefined') {
        return `<li>No Results Found</li>`;
    }

    return articles.map(article => {
        let title = article.title;
        let source = article.source.name;
        let biasDescription = biasScore(source);
        let credibilityDescriptor = credibilityScore(source);
        let url = article.url;
        let description = article.description;
        return `<li><h3><a target=_blank href="${url}">${title}</a></h3><div class="sourceInfo" <p>${source} | ${biasDescription}   <a target="_blank" href="faq.html" alt="FAQ Page">?</a></p><p>${credibilityDescriptor}</p><div class="seeMore-js"><p class="viewer">See More</p><p class="description hidden">${description}</p></div></div></li>`;
    }).join("");
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
                biasDescriptor = `Bias: <span style="color:rgb(118, 122, 165)">Leans Left</span>`;
            }
            else if (biasNum > -31 & biasNum < -18) {
                biasDescriptor = `Bias: <span style="color:rgb(52, 64, 189)">Hyper Left</span>`;
            }
            else if (biasNum > 5 & biasNum < 19) {
                biasDescriptor = `Bias: <span style="color:rgb(167, 104, 104)">Leans Right</span>`;
            }
            else if (biasNum > 18 & biasNum < 31) {
                biasDescriptor = `Bias: <span style="color:rgb(207, 53, 53)">Hyper Right</span>`;
            }
            else if (biasNum<-30) {
                biasDescriptor = `Bias: <span style="color:rgb(0, 17, 255)">Extreme Left</span>`;
            }
            else if (biasNum>30) {
                biasDescriptor = `Bias: <span style="color:rgb(255, 0, 0)">Extreme Right</span>`;
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
    let num = 5;
    if (popularRedditsData.aggs.link_id.length < 5) {
        num = popularRedditsData['aggs']['link_id'].length;
    }
    for (let i=0; i<num; i++){
        let popularReddits = popularRedditsData.aggs.link_id[i].data;
        let redditData = {
        newsSite: popularReddits.domain,
        redditLink: popularReddits.full_link,
        redditId: popularReddits.id,
        newsTitle: popularReddits.title,
        newsSiteUrl: popularReddits.url
        }
        redditDataArray.push(redditData);
    }
    return redditDataArray;
}

function CommentsForRedditData (redditArticles, searchTerm) {
    const pendingCommentCalls = redditArticles.map(reddit => {
        var apiCallConfig = {
            "url": `https://api.pushshift.io/reddit/search/comment/?link_id=${reddit.redditId}&q=${searchTerm}`,
            "method": "GET",
        }
        return $.ajax(apiCallConfig);
    });
    Promise
    .all(pendingCommentCalls)
    .then(results => {
        let allComments = [];
        results.forEach(commentsApiResponse => {
            let comments = getRelevantCommentInfo(commentsApiResponse);
            allComments.push(comments)

        })
        return allComments
    
    })
    .then((allComments) => {
        displayallComments(allComments, redditArticles);
        hideLoading()
    })
    ;
    
}


function displayallComments (allComments, redditArray) {

    let commentHTML = 
        redditArray.map((article, index) => {
            const thisArticlesComments = allComments[index];

            return `<li><h3>${article.newsTitle}</h3>
            <p>Source: ${article.newsSite} <a target="_blank" href="${article.newsSiteUrl}">View orginal article</a></p>
            <div class="see-comments-js"><p class="comments-view-js">See Comments</p><div class="comments-js hidden">`
            + 
            thisArticlesComments.map(comment => {
                return `<div class="each-comment"><p>Username: ${comment.username}</p>
                <p class="commentContent">${comment.comment}` + '&nbsp;&nbsp' + `<a class="comment-link-js" href="${article.redditLink}" target="_blank">See comment in original context</a></p></div>`;
            }).join("");
        }).join("")
        +
        '</div></div></li>';

    $('.comments-results').html(commentHTML);

    hideLoading ();
    revealResults ();
}

function getRelevantCommentInfo (commentsApiResponse) {
    console.log('commentsresponse', commentsApiResponse);
    const commentArray = [];
    const comments = commentsApiResponse.data;

    for (let i = 0; i < comments.length; i++){
        if (commentArray.length == 5) break;
        const comment = comments[i];

        if (comment.body.length <= 350){
            commentArray.push({
                username: comment.author,
                comment: comment.body
            })
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
    })
}

function clickSeeLess () {
    $('.result-div-js').on('click','.seeLess-js', event => {
        $(event.currentTarget).find('.description').addClass('hidden');
        $(event.currentTarget).find('.viewer').text('See More');
        $(event.currentTarget).removeClass('seeLess-js');
        $(event.currentTarget).addClass('seeMore-js');
    })
}

function clickSeeComments () {
    $('.result-div-js').on('click','.see-comments-js', event => {
        $(event.currentTarget).find('.comments-js').removeClass('hidden');
        $(event.currentTarget).find('.comments-view-js').text('Hide Comments');
        $(event.currentTarget).removeClass('see-comments-js');
        $(event.currentTarget).addClass('hide-comments-js');
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

function preventPropigationOnCommentsClick () {
    $('.result-div-js').on('click','.comment-link-js', event => {
        event.stopImmediatePropagation();
    })
}

$(newsCompareHandler);