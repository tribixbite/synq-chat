# React Together

> React Together is a JavaScript library that enables developers to easily build real-time, collaborative, and synchronized web applications. It allows users to interact and work together seamlessly on any website without needing complex backend or socket setup, leveraging the Multisynq DePIN infrastructure for its networking capabilities.

This file provides LLM-friendly content to understand and use the React Together library. It includes guidance and links to detailed documentation pages.

## Overview & Getting Started
- [React Together Home](https://reacttogether.dev/): The official homepage, introducing real-time collaboration features.
- [Getting Started](https://reacttogether.dev/getting-started): A guide to installing React Together, setting up the context, and making your first synchronized components.
- [Dependencies](https://reacttogether.dev/Dependencies): Information on the underlying technologies and libraries React Together uses, primarily Multisynq.

## Core Concepts
- [ReactTogether Component](https://reacttogether.dev/ReactTogether): Documentation for the main context provider component essential for all React Together features.
- [Pricing](https://reacttogether.dev/pricing): Details on the cost structure, free tier, and how Multisynq DePIN infrastructure contributes to affordability.
- [Multisynq Integration](https://reacttogether.dev/multisynq): Explains how React Together leverages Multisynq for its synchronization capabilities and how to use custom models for advanced logic.
- [Utils Module](https://reacttogether.dev/utils): Documentation for helper functions provided by React Together for common tasks like deriving nicknames and managing session URLs.

## API Reference: Hooks
- [useStateTogether Hook](https://reacttogether.dev/useStateTogether): Synchronizes a state value across all users in a session, similar to React's `useState`.
- [useStateTogetherWithPerUserValues Hook](https://reacttogether.dev/useStateTogetherWithPerUserValues): Manages a state where each user has their own value, but all users can see each other's values.
- [useFunctionTogether Hook](https://reacttogether.dev/useFunctionTogether): Enables a function to be called by one user and executed simultaneously with the same arguments for all users in the session.
- [useChat Hook](https://reacttogether.dev/useChat): Provides functionality for sending and receiving messages within a shared chat room.
- [useCursors Hook](https://reacttogether.dev/useCursors): Enables real-time tracking and display of cursor positions for all connected users.
- [useConnectedUsers Hook](https://reacttogether.dev/useConnectedUsers): Returns an array of objects representing all users currently connected to the session.
- [useHoveringUsers Hook](https://reacttogether.dev/useHoveringUsers): Identifies which users are currently hovering over a specific DOM element.
- [useNicknames Hook](https://reacttogether.dev/useNicknames): Manages user nicknames, allowing users to set and view nicknames within a session.
- [useAllNicknames Hook](https://reacttogether.dev/useAllNicknames): A simplified hook to get an object containing all user nicknames in the current session.
- [useCreateRandomSession Hook](https://reacttogether.dev/useCreateRandomSession): Provides a function to connect the user to a new, randomly generated session.
- [useIsTogether Hook](https://reacttogether.dev/useIsTogether): Returns a boolean indicating if the user is currently connected to a React Together session.
- [useLeaveSession Hook](https://reacttogether.dev/useLeaveSession): Provides a function to disconnect the user from the current React Together session.
- [useJoinUrl Hook](https://reacttogether.dev/useJoinUrl): Returns the unique URL that other users can use to join the current session.
- [useMyId Hook](https://reacttogether.dev/useMyId): Returns the unique ID of the local user within the React Together session.

## API Reference: Components
- [Chat Component](https://reacttogether.dev/Chat): A pre-built UI component for adding a chat interface to your application.
- [Cursors Component](https://reacttogether.dev/Cursors): A component that visually displays the cursors of all connected users on the page.
- [SessionManager Component](https://reacttogether.dev/SessionManager): A UI component to manage session connections, including creating, sharing, and leaving sessions.
- [ConnectedUsers Component](https://reacttogether.dev/ConnectedUsers): A component that displays the avatars or names of users currently connected to the session.
- [HoverHighlighter Component](https://reacttogether.dev/HoverHighlighter): A wrapper component that highlights its children when any user hovers over them.

## UI Kit Integrations
- [CheckboxTogether (Ant Design)](https://reacttogether.dev/antdesign/Checkbox): A synchronized checkbox component for Ant Design.
- [MultiSelectTogether (Ant Design)](https://reacttogether.dev/antdesign/MultiSelect): A synchronized multi-select dropdown component for Ant Design.
- [RateTogether (Ant Design)](https://reacttogether.dev/antdesign/Rate): A synchronized rating component for Ant Design.
- [SelectButtonTogether (Ant Design)](https://reacttogether.dev/antdesign/SelectButton): A synchronized select button component for Ant Design.
- [SelectTogether (Ant Design)](https://reacttogether.dev/antdesign/Select): A synchronized select dropdown component for Ant Design.
- [SliderTogether (Ant Design)](https://reacttogether.dev/antdesign/Slider): A synchronized slider component for Ant Design.
- [SwitchTogether (Ant Design)](https://reacttogether.dev/antdesign/Switch): A synchronized switch component for Ant Design.
- [ToggleButtonTogether (Ant Design)](https://reacttogether.dev/antdesign/ToggleButton): A synchronized toggle button component for Ant Design.
- [CheckboxTogether (PrimeReact)](https://reacttogether.dev/primereact/Checkbox): A synchronized checkbox component for PrimeReact.
- [ColorPickerTogether (PrimeReact)](https://reacttogether.dev/primereact/ColorPicker): A synchronized color picker component for PrimeReact.
- [DropdownTogether (PrimeReact)](https://reacttogether.dev/primereact/Dropdown): A synchronized dropdown component for PrimeReact.
- [InputSwitchTogether (PrimeReact)](https://reacttogether.dev/primereact/InputSwitch): A synchronized input switch component for PrimeReact.
- [KnobTogether (PrimeReact)](https://reacttogether.dev/primereact/Knob): A synchronized knob component for PrimeReact.
- [MultiSelectTogether (PrimeReact)](https://reacttogether.dev/primereact/MultiSelect): A synchronized multi-select component for PrimeReact.
- [RatingTogether (PrimeReact)](https://reacttogether.dev/primereact/Rating): A synchronized rating component for PrimeReact.
- [SelectButtonTogether (PrimeReact)](https://reacttogether.dev/primereact/SelectButton): A synchronized select button component for PrimeReact.
- [TabViewTogether (PrimeReact)](https://reacttogether.dev/primereact/TabView): A synchronized tab view component for PrimeReact.
- [ToggleButtonTogether (PrimeReact)](https://reacttogether.dev/primereact/ToggleButton): A synchronized toggle button component for PrimeReact.
- [TriStateCheckboxTogether (PrimeReact)](https://reacttogether.dev/primereact/TriStateCheckbox): A synchronized tri-state checkbox component for PrimeReact.

## Community & Resources
- [Contributing to React Together](https://reacttogether.dev/contributing): Guidelines and information on how to contribute to the React Together project.
- [React Together Changelog](https://reacttogether.dev/changelog): A log of all changes, updates, and new features across different versions of React Together.
- [HackTogether Hackathon](https://reacttogether.dev/hackathon): Information about the HackTogether hackathon event focused on building with React Together.
- [Cookie Policy](https://reacttogether.dev/cookies): Details on how React Together's website uses cookies.

## Optional
- [React Together on NPM](https://www.npmjs.com/package/react-together): The official package page on NPM for installing React Together.
- [React Together GitHub Repository](https://github.com/multisynq/react-together): The source code repository for React Together, including issues and pull requests.
- [Multisynq.io](https://multisynq.io/): The official website for Multisynq, the underlying DePIN infrastructure powering React Together.
- [Multisynq Client Documentation](https://multisynq.io/docs/client/): Documentation for the Multisynq client library.
- [Multisynq React Documentation](https://multisynq.io/docs/multisynq-react/): Documentation for the `@multisynq/react` library, which React Together builds upon.