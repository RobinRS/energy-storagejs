# energy-storagejs

[![npm version](https://badge.fury.io/js/%40robinrs%2Fenergy-storagejs.svg)](https://badge.fury.io/js/%40robinrs%2Fenergy-storagejs)

`energy-storagejs` is a powerful JavaScript library designed to simplify the process of accessing and retrieving data from energy storage systems. Its intuitive API enables seamless interaction with VARTA Storage Systems, allowing users to effortlessly access various battery-related information. Whether you need to retrieve real-time battery status, historical performance data, or other system-specific details, energy-storagejs provides a straightforward and efficient solution for integrating energy storage functionality into your JavaScript applications.

`energy-storagejs` is a JavaScript library for accessing and retrieving data from energy storage systems. It provides an API for interacting with VARTA Storage Systems and retrieving battery-related information.

## Installation

You can install `energy-storagejs` via npm:

```shell
npm install @robinrs/energy-storagejs
```

## Usage

```javascript
// Access API Class Object
const battery = energyStorage({
  ip: "192.168.2.130",
  fullRequest: "/cgi/ems_data.js",
  simpleRequest: "/cgi/ems_data.xml",
  paramsRequest: "/cgi/ems_conf.js",
  type: "v", // Type for VARTA Storage Systems
});

// Request the data from the Battery
await battery.requestSimple();

// Data can now be accessed in raw format, to use the provided methods, parse the data
battery.parse();
```

Once parsed, the following methods can be used to retrieve battery information:

- `getTimeStamp()`: Returns the timestamp of the data.
- `getState()`: Returns the state of the battery.
- `getPercentageF()`: Returns the battery percentage as a formatted value with the unit.
- `getPercentage()`: Returns the battery percentage.
- `...` Check out the docs to see all methods

## TODO

Please note that this package is still a work in progress. The following tasks are currently being worked on:

- [] Add comments to further explain the code.
- [] Implement the handler for more detailed requests.
- [] Implement an interval to keep the data fresh.
- [] Add support for more battery systems and companies.

Your contributions and feedback are welcome!

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
