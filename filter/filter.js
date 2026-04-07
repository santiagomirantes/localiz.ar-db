const form = document.querySelector(".filter")
const submitButton = document.querySelector(".submit")
const result = document.querySelector(".result code")

function makeContainer(type, id, name, status) {
    const div = document.createElement("div")
    const label = document.createElement("label")
    const checkbox = document.createElement("input")

    div.id = id
    div.className = type

    label.setAttribute("for", "checkbox_" + id)
    label.textContent = name

    checkbox.type = "checkbox"
    checkbox.checked = !!status
    checkbox.id = "checkbox_" + id

    div.appendChild(label)
    div.appendChild(checkbox)

    return [div,checkbox]

}

document.body.onload = async () => {
    const res = await fetch("../dataset/provincias.json")

    const provs = await res.json()

    for (const [provID, provName] of provs) {
        const [div,checkbox] = makeContainer("prov", provID, provName, true)

        const openButton = document.createElement("button")
        const openSection = document.createElement("section")

        openButton.textContent = ">"
        openSection.id = "_" + provID

        openButton.onclick = async ev => {
            ev.preventDefault()

            if (!openSection.classList.contains("generated")) {
                const res = await fetch(`../dataset/${provID}/ciudades.json`)

                const cities = Object.entries(await res.json())
                let pos = 0

                function int() {
                    const [key, value] = cities[pos]
                    if (key.charAt(0) === "_") {
                        const [subdiv,subcheckbox] = makeContainer("city", key.slice(1, key.length), value, checkbox.checked)
                        openSection.appendChild(subdiv)
                    }
                    else {
                        pos++
                        if (!cities[pos]) {
                            return
                        }
                        return int()
                    }

                    pos++

                    if (!cities[pos]) {
                        return
                    }

                    setTimeout(int, 100)
                }

                int()

                openSection.classList.add("generated")
            }

            div.classList.toggle("opened")
            openSection.classList.toggle("opened")

        }

        checkbox.onclick = ev => {
            for(const subdiv of openSection.childNodes) {
                 const subcheckbox = subdiv.querySelector("input")
                 subcheckbox.checked = checkbox.checked
            }
        }

        div.appendChild(openButton)

        form.appendChild(div)
        form.appendChild(openSection)
    }
}

submitButton.onclick = () => {
    const filter = {
        provs: {},
        cities: {}
    }

    let totalProvs = 0
    let validProvCount = 0
    let provsWithAllCities = 0
    for(const provDiv of form.querySelectorAll(".prov")) {
        totalProvs++

        let hasAllCities = true

        const provCheckbox = provDiv.querySelector("input")

        if(provCheckbox.checked) {
            filter.provs[provDiv.id] = true
            validProvCount++

            const openSection = form.querySelector("#_" + provDiv.id)
            const cities = openSection.querySelectorAll("div")

            let totalCities = 0
            let validCityCount = 0

            filter.cities[provDiv.id] = {}

            for(const cityDiv of cities) {
                totalCities++
                const cityCheckbox = cityDiv.querySelector("input")

                if(cityCheckbox.checked) {
                    hasAllCities = false
                    filter.cities[provDiv.id][cityDiv.id] = true
                    validCityCount++
                }
            }

            if(totalCities === validCityCount) {
                filter.cities[provDiv.id] = undefined
            }

            if(hasAllCities) {
                provsWithAllCities++
            }
        }
    }

    if(totalProvs === validProvCount) {
        filter.provs = undefined
    }
    if(provsWithAllCities === totalProvs) {
        filter.cities = undefined
    }
    result.textContent= JSON.stringify(filter)
    Prism.highlightAll()
}