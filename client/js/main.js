(function() {

    const getData = done => {

        const resource = 'https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json';
        const init = {
            method: 'GET',
        };

        fetch(resource, init)
            .then(response => response.json())
            .then(data => {
                done(data);
            })
            .catch(err => console.log(err));

    };

    getData(data => {
        console.log(data);
    });

})();