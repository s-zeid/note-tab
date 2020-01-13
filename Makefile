all: index.html

.PHONY: deploy


HOST := s.zeid.me
DIR  := ~/srv/www/bnay.me/_/note-tab

deploy:
	ssh $(HOST) 'cd $(DIR); pwd; git pull && git submodule update && make'
