build: deps
	npx vite build

deps: node_modules/.deps
node_modules/.deps: package.json package-lock.json
	npm install
	@touch $@

typecheck: deps
	npx tsc --noEmit

fmt: deps
	npx dprint fmt

check: deps
	npx dprint check
	npx tsc --noEmit
