NODE_BIN = ./node_modules/.bin

check: lint test

lint:
	$(NODE_BIN)/eslint .

test:
	$(NODE_BIN)/mocha

format:
	$(NODE_BIN)/prettier --write **/*.{yml,md,js,json}

.PHONY: check lint test
