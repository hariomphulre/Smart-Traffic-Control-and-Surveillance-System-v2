FROM nginx:1.27-alpine
RUN apk add --no-cache gettext

COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/default.conf.template /etc/nginx/conf.d/default.conf.template
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# ONLY expose port 80 inside your docker cluster network
EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]