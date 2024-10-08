import { createElement } from 'lwc';
import TestOmerLWCV2 from 'c/testOmerLWCV2';

describe('c-test-omer-l-w-c-v-2', () => {
    afterEach(() => {
        // The jsdom instance is shared across test cases in a single file so reset the DOM
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('TODO: test case generated by CLI command, please fill in test logic', () => {
        // Arrange
        const element = createElement('c-test-omer-l-w-c-v-2', {
            is: TestOmerLWCV2
        });

        // Act
        document.body.appendChild(element);

        // Assert
        // const div = element.shadowRoot.querySelector('div');
        expect(1).toBe(1);
    });
});