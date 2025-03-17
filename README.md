#  User Interface Component Library for the Web

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/playcanvas/pcui/blob/main/LICENSE)

| [User Guide](https://developer.playcanvas.com/user-manual/pcui/) | [API Reference](https://api.playcanvas.com/modules/PCUI.html) | [ESM Examples](https://playcanvas.github.io/pcui/examples/) | [React Examples](https://playcanvas.github.io/pcui/storybook/) | [Blog](https://blog.playcanvas.com/) | [Forum](https://forum.playcanvas.com/) | [Discord](https://discord.gg/RSaMRzg) |

This library enables the creation of reliable and visually pleasing user interfaces by providing fully styled components that you can use directly on your site. The components are useful in a wide range of use cases, from creating simple forms to building graphical user interfaces for complex web tools.

A full guide to using the PCUI library can be found [here](https://developer.playcanvas.com/user-manual/pcui/).

## Data Binding

The PCUI library offers a data binding layer that can be used to synchronize data across multiple components. It offers two way binding to a given observer object, so updates made in a component are reflected in the observer's data and distributed out to all other subscribed components. A simple use case is shown below:

