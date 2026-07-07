# Contributing to Moaz Moderation Bot

First off, thank you for considering contributing to Moaz Moderation Bot! It's people like you that make this project such a great tool.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct, which is to treat everyone with respect and create a positive environment.

## How Can I Contribute?

### Reporting Bugs

This section guides you through submitting a bug report. Following these guidelines helps maintainers and the community understand your report, reproduce the behavior, and find related reports.

**Before submitting a bug report:**
* Check the issue tracker to see if the bug has already been reported.
* Make sure you're using the latest version of the project.
* Determine if your bug is really a bug and not an issue with your local environment.

**How to submit a good bug report:**
1. Use a clear and descriptive title for the issue to identify the problem.
2. Describe the exact steps which reproduce the problem with as much detail as possible.
3. Provide specific examples to demonstrate the steps.
4. Describe the behavior you observed after following the steps and point out what exactly is the problem with that behavior.
5. Explain which behavior you expected to see instead and why.
6. Include screenshots or GIFs showing the problem if possible.
7. If the problem is related to performance or memory, include a CPU profile capture and a memory heap snapshot.
8. If the crash is related to TypeScript or Node.js, include a stack trace by running with the `--trace-warnings` flag.
9. Specify your operating system name and version, Node.js version, npm version, and any other relevant information.

### Suggesting Enhancements

This section guides you through submitting an enhancement suggestion, including completely new features and minor improvements to existing functionality.

**Before creating an enhancement suggestion:**
* Check the issue tracker to see if the enhancement has already been suggested.
* Determine if your enhancement is really needed by a significant portion of users.

**How to submit a good enhancement suggestion:**
1. Use a clear and descriptive title for the issue to identify the suggestion.
2. Provide a step-by-step description of the suggested enhancement with as much detail as possible.
3. Provide specific examples to demonstrate the steps if applicable.
4. Describe the current behavior and explain which behavior you expected to see instead and why.
5. Explain why this enhancement would be useful to most users.
6. List some other bots or applications where this enhancement exists if applicable.

### Pull Requests

The process described here has several goals:
- Maintain quality
- Fix problems that are important to users
- Engage the community in working toward the best possible Moaz Moderation Bot
- Enable a sustainable system for Moaz Studio's maintainers to review contributions

Please follow these steps to have your contribution considered by the maintainers:

1. Follow all instructions in [the template](PULL_REQUEST_TEMPLATE.md)
2. Follow the [styleguides](#styleguides)
3. After you submit your pull request, verify that all [status checks](https://help.github.com/articles/about-status-checks/) are passing

While the prerequisites above must be satisfied prior to having your pull request reviewed, the reviewer(s) may ask you to complete additional design work, tests, or other changes before your pull request can be ultimately accepted.

## Styleguides

### Git Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally after the first line
* When only changing documentation, include `[ci skip]` in the commit title
* Consider starting the commit message with an applicable emoji:
    * 🎨 `:art:` when improving the format/structure of the code
    * 🐎 `:racehorse:` when improving performance
    * 🚱 `:non-potable_water:` when plugging memory leaks
    * 📝 `:memo:` when writing docs
    * 🐛 `:bug:` when fixing a bug
    * 🔥 `:fire:` when removing code or files
    * 💚 `:green_heart:` when fixing the CI build
    * ✅ `:white_check_mark:` when adding tests
    * 🔒 `:lock:` when dealing with security
    * ⬆️ `:arrow_up:` when upgrading dependencies
    * ⬇️ `:arrow_down:` when downgrading dependencies
    * 👕 `:shirt:` when removing linter warnings

### TypeScript Styleguide

* Use 4 spaces for indentation, not tabs
* Include type declarations for all variables, parameters, and return types
* Use `camelCase` for variables, functions, and instances
* Use `PascalCase` for classes, interfaces, types, and enum values
* Use `UPPER_CASE` for constants that will never change
* Prefix interfaces with `I` (e.g., `ITicket`)
* Prefix private class fields with an underscore (e.g., `_privateField`)
* Add trailing commas on multi-line definitions
* Use single quotes for strings unless the string contains single quotes
* Place an empty line between methods in a class
* Always add semicolons at the end of statements
* Use template literals for string interpolation
* Always destructure when accessing multiple properties of an object
* Use the spread operator for array/object copies instead of `Object.assign`
* Prefer arrow functions over function expressions
* Explicitly define return types for functions

### Documentation Styleguide

* Use [Markdown](https://guides.github.com/features/mastering-markdown/) for documentation
* Reference methods and classes in markdown with appropriate backticks and type hints:
  * Global functions: `` `functionName()` ``
  * Classes: `` `ClassName` ``
  * Class methods: `` `ClassName.methodName()` ``
  * Events: `` `event: eventName` ``
* Document complex logic with block comments above the code
* Use descriptive JSDoc comments for exported functions and classes

## Development Environment Setup

1. Fork the repository on GitHub
2. Clone your fork locally
   ```
   git clone https://github.com/yourusername/moderation-bot.git
   cd moderation-bot
   ```
3. Install dependencies
   ```
   npm install
   ```
4. Copy the `.env.example` file to `.env` and fill in your development credentials
   ```
   cp .env.example .env
   ```
5. Start the development server
   ```
   npm run dev
   ```

## Testing

We use the following tools for testing and quality assurance:

* ESLint for linting TypeScript code
* Jest for unit tests (planned)
* Integration testing via manual Discord testing

Before submitting a pull request, make sure all your changes pass the linting process:

```
npm run lint
```

## Additional Notes

### Issue Labels

This project uses the following issue labels:

* `bug` - Something isn't working as expected
* `enhancement` - New feature or request
* `documentation` - Improvements or additions to documentation
* `help-wanted` - Issues that need assistance
* `good-first-issue` - Good for newcomers
* `question` - Further information is requested
* `wontfix` - This will not be worked on
* `duplicate` - This issue or pull request already exists
* `invalid` - This doesn't seem right

### Getting Help

If you need help with anything related to the project:

1. Check the documentation in the repository
2. Join our [Discord server](https://discord.gg/z82w57MzUC) for real-time help
3. Open an issue with the `question` label

## Thank You!

Thank you for taking the time to contribute to Moaz Moderation Bot. Your contributions are greatly appreciated! 