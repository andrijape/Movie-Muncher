let searchInput = document.getElementById('search');
let searchBtn = document.getElementById('searchBtn');
let moviePreview = document.querySelector('#moviePreview');
let movies = document.getElementById('movies');

let movieObj = {};

let titlesLS = localStorage.getItem('movieTitles') !== null ? JSON.parse(localStorage.getItem('movieTitles')) : [];
let titles = [...titlesLS];

let minutesLS = localStorage.getItem('movieMinutes') !== null ? JSON.parse(localStorage.getItem('movieMinutes')) : [];
let minutes = [...minutesLS];

let ratingLS = localStorage.getItem('movieRatings') !== null ? JSON.parse(localStorage.getItem('movieRatings')) : [];
let rating = [...ratingLS];

let posterLS = localStorage.getItem('moviePoster') !== null ? JSON.parse(localStorage.getItem('moviePoster')) : [];
let poster = [...posterLS];

/* Search Event Listeners */
searchInput.addEventListener('keydown', e => {
    if(e.code === 'Enter') {
        if(searchInput.value === '') {
            alert('Enter a movie name');
        } else {
            removePrevDrop();
            getMovieData();
        }
    };
});

searchBtn.addEventListener('click', () => {
    if(searchInput.value === '') {
        alert('Enter a movie name');
    } else {
        removePrevDrop();
        getMovieData();
    };
});

/* Fixed Action Button */
document.addEventListener('DOMContentLoaded', function() {
    var elems = document.querySelectorAll('.fixed-action-btn');
    var instances = M.FloatingActionButton.init(elems, {
        direction: 'top'
    });
});

/* Tooltip Function */
document.addEventListener('DOMContentLoaded', function() {
    var elems = document.querySelectorAll('.tooltipped');
    var instances = M.Tooltip.init(elems, {
        direction: 'left'
    });
});

/* Fetch movie data */
async function getMovieData() {
    const response = await fetch(`http://www.omdbapi.com/?s=${searchInput.value}&apikey=f48fad72&`);
    const data = await response.json();
    results(data);
};

const results = (res) => {
    // Get all results
    let allSearchResults = res.Search;

    // Create dropdown list
    const searchSpan = document.getElementById('searchSpan');
    const select = document.createElement('select');
    select.classList.add('results'); 
    select.innerHTML = `<option selected="true" disabled="disabled">Click here to see your results: </option>`;
    searchSpan.append(select);

    // Add all results to dropdown 
    for(let i of allSearchResults) {
        const opt = document.createElement('option');
        opt.innerHTML = `${i.Title} (${i.Year})`;

        select.appendChild(opt);
    };

    // Remember the selection and clear input
    select.onchange = function() {
        let index = select.selectedIndex - 1;

        // Set query for the selected movie
        movieObj.imdbID = res.Search[index].imdbID;

        // Fetch again
        fetchDataAgain();
        
        // Clear input fields
        searchInput.value = '';
    };
};

// Check if there is another search, and remove previous dropdown list
function removePrevDrop() {
    let previousSelect = document.querySelectorAll('select');
    
    if(previousSelect.length > 0) {
        previousSelect[0].remove();
    }; 
};

// Fetch data again, because when you get multiple results from first fetch, there is a little data for them
async function fetchDataAgain() {
    const response = await fetch(`http://www.omdbapi.com/?i=${movieObj.imdbID}&apikey=f48fad72&`);
    const data = await response.json();

    // Populate movie object
    movieObj.title = data.Title;
    movieObj.year = data.Year;
    movieObj.plot = data.Plot;
    movieObj.rating = data.imdbRating;
    movieObj.votes = data.imdbVotes;
    movieObj.time = data.Runtime;
    movieObj.poster = data.Poster;

    createMoviePreview();
};

/* Create movie preview function */
function createMoviePreview() {
    // Create preview for movie
    let moviePreviewCard = `
        <div class="movie animate__animated animate__zoomIn">   
            <img src="${movieObj.poster}">
        </div>

        <div class="data"> 
            <p><i class="fas fa-film"></i> : ${movieObj.title}</p>
            <p><i class="far fa-calendar-alt"></i> : ${movieObj.year}</p>
            <p><i class="fas fa-align-left"></i> : ${movieObj.plot}</p>
            <p><i class="fas fa-poll"></i> : ${movieObj.rating}</p>
            <p><i class="fas fa-users"></i> : ${movieObj.votes}</p>
            <p><i class="fas fa-stopwatch"></i> : ${movieObj.time}</p>
            <ul>
                <li><a class="btn-floating green accent-4 btn tooltipped"><i class="fas fa-plus-circle"></i></a></li>
            </ul>
        </div>
    `;

    // Display info for selected movie 
    moviePreview.innerHTML = moviePreviewCard; 

    let addBtn = document.querySelector('.fa-plus-circle');

    // Check if movie has already been watched
    for(let movie of titles) {
        if(movie === movieObj.title) {
            addBtn.parentNode.parentNode.textContent = 'You have already seen this movie';
        };
    };

    // Add movie to the list of seen movies
    addBtn.addEventListener('click', e => {     
        // When movie is added after the preview, use info for that movie
        titles.push(movieObj.title);
        minutes.push(movieObj.time);
        rating.push(movieObj.rating);
        poster.push(movieObj.poster);

        // Create added movie
        let singleMovie = `
            <div class="movie" style="position:relative;">   
                <img src="${movieObj.poster}" style="position:relative; z-index:1;">
                <div class="btn-wrapper" style="position:absolute; z-index:2; left: 5%; top: -5%;">
                    <li><a class="btn-floating btn-small waves-effect waves-light red darken-1"><i class="fas fa-minus-circle"></i></a></li>
                </div>
            </div>
        `; 
         
        // Remove add movie button from movie preview div after a movie has been choosen
        e.target.parentNode.parentNode.remove();
        
        // Add movies to UI 
        movies.innerHTML += singleMovie;

        // Add movie data to local storage
        addToLS(titles);
        addRatingLS(rating);
        addMinLS(minutes);   
        addPosterLS(poster);

        // Remove movie from the UI
        removeMovieUI();
    });
};

/* Remove movies from UI and local storage*/
function removeMovieUI() {
    let removeBtn = Array.from(document.querySelectorAll('.fa-minus-circle')); 

    // Find clicked remove button, delete that movie and find index of that movie in local storage
    removeBtn.forEach(btn => {
        btn.addEventListener('click', (e) => {
            let idx = removeBtn.indexOf(e.target);
            
            removeBtn.splice(idx, 1);

            e.target.parentNode.parentNode.parentNode.parentNode.classList.add('animate__animated', 'animate__zoomOut');

            setTimeout(() => {
                e.target.parentNode.parentNode.parentNode.parentNode.remove();
            }, 500);

            removeMovieLS(idx);
            removeMinutesLS(idx);
            removeRatingsLS(idx);
            removePostersLS(idx);
        });
    });

    // Remove movie from local storage
    function removeMovieLS(idx) {
        let moviesFromLS = JSON.parse(localStorage.getItem('movieTitles'));

        // Remove selected movie from LS
        moviesFromLS.splice(idx, 1);
    
        // Remove selected movie from titles
        titles.splice(idx, 1);
        
        // Add new array to local storage
        localStorage.setItem('movieTitles', JSON.stringify(moviesFromLS));
                    
        countMovies();        
    };

    // Remove minutes from local storage
    function removeMinutesLS(idx) {
        // Remove selected minutes
        minutes.splice(idx, 1);
        
        // Add new array to local storage
        localStorage.setItem('movieMinutes', JSON.stringify(minutes));

        runtime();
    };

    // Remove ratings from local storage
    function removeRatingsLS(idx) {
        // Remove selected ratings
        rating.splice(idx, 1);

        // Add new array to local storage
        localStorage.setItem('movieRatings', JSON.stringify(rating));

        averageRating();
    };

    // Remove posters from local storage    
    function removePostersLS(idx) {
        poster.splice(idx, 1);

        // Add new array to local storage
        localStorage.setItem('moviePoster', JSON.stringify(poster));
    };
};
   
/* Add titles to local storage */
function addToLS(titles) {
    // Clear local storage
    localStorage.removeItem('movieTitles');

    // Add to local storage
    localStorage.setItem('movieTitles', JSON.stringify(titles));

    // Count movies
    countMovies();
};

/* Function countMovies */
function countMovies() {
    let count = localStorage.getItem('movieTitles') !== null ? JSON.parse(localStorage.getItem('movieTitles')).length : 0;

    let countFAB = document.querySelector('.total');
    
    countFAB.addEventListener('mouseover', () => {
        countFAB.setAttribute('data-tooltip', `You have seen ${count} movies!`);
    });
};

/* Add minutes to local storage */
function addMinLS(minutes) {
    localStorage.setItem('movieMinutes', JSON.stringify(minutes));

    runtime();
};

/* Function total runtime in minutes */
function runtime() {
    // Get minutes from local storage
    let minutesArr = localStorage.getItem('movieMinutes') !== null ? JSON.parse(localStorage.getItem('movieMinutes')) : 0;

    // Calculate the minutes
    let total = 0;
    for(var i = 0; i < minutesArr.length; i++) {
        if(minutesArr[i] === 'N/A') {
            minutesArr[i] = 0;
        } else {
            total += parseFloat(minutesArr[i]);
        };
    };
    let totalMinutes = total;
    
    // Show in tolltip
    let runtimeFAB = document.querySelector('.runtime');

    runtimeFAB.addEventListener('mouseover', () => {
        runtimeFAB.setAttribute('data-tooltip', `Your runtime is: ${parseFloat(totalMinutes)} minutes!`);
    });

    // Convert minutes into minutes, hours, days
    convertMinutes(parseFloat(totalMinutes));
}

/* Convert minutes function */
function convertMinutes(num){
    let days = Math.floor(num / 1440);
    let hours = Math.floor((num % 1440) / 60);
    let min = Math.floor(num % 60);

    // Show in tolltip
    let durationFAB = document.querySelector('.duration');

    durationFAB.addEventListener('mouseover', () => {
        durationFAB.setAttribute('data-tooltip', `Total runtime is: ${days} days, ${hours} hours and ${min} minutes!`);
    }); 
};   

/* Add rating to local storage  */
function addRatingLS(rating) {
    localStorage.removeItem('movieRatings');

    localStorage.setItem('movieRatings', JSON.stringify(rating));

    averageRating();
};

/* Calculate average rating of the movies */
function averageRating() {
    // Get rating from local storage
    let movieRating = JSON.parse(localStorage.getItem('movieRatings'));
    
    // Calculate rating
    let total = 0;
    for(var i = 0; i < movieRating.length; i++) {
        movieRating[i] === 'N/A' ? movieRating[i] = 0 : total += parseFloat(movieRating[i]);
    };
    let averageRating = (total / movieRating.length).toFixed(1);

    // Show in tolltip
    let ratingFAB = document.querySelector('.rating');

    ratingFAB.addEventListener('mouseover', () => {
        ratingFAB.setAttribute('data-tooltip', `Average rating of the movies is: ${averageRating} / 10!`);
    });
};

/* Add movie posters to LS */
function addPosterLS(poster) {
    localStorage.setItem('moviePoster', JSON.stringify(poster))
};

/* On init, populate UI if there is a content in local storage */
window.addEventListener('DOMContentLoaded', () => {
    // Get posters from local storage
    let postersFromLS = localStorage.getItem('moviePoster') !== null ? JSON.parse(localStorage.getItem('moviePoster')) : null;

    for(let img of postersFromLS) {
        let singleMovie = `
            <div class="movie" style="position:relative;">   
                <img src="${img}" style="position:relative; z-index:1;">
                <div class="btn-wrapper" style="position:absolute; z-index:2; left: 5%; top: -5%;">
                    <li><a class="btn-floating btn-small waves-effect waves-light red darken-1"><i class="fas fa-minus-circle"></i></a></li>
                </div>
            </div>
        `; 

        movies.innerHTML += singleMovie;
    }; 

    countMovies();
    runtime();
    averageRating();
    removeMovieUI();   
});