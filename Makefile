.PHONY: jquery

jquery:
	git clone git@github.com:jquery/jquery.git

web:
	python -m http.server 8080
