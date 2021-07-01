# config valid only for current version of Capistrano
lock '3.16.0'

set :application, 'resourcebot'

# TODO: If you fork this repository, replace the following line with your git url
set :repo_url, 'git@github.com:arubin18/resourcebot.git'

# Default branch is :master
# ask :branch, `git rev-parse --abbrev-ref HEAD`.chomp

# TODO: update the deploy target directory
# Default deploy_to directory is /var/www/my_app_name

# Default value for :scm is :git
# set :scm, :git

# Default value for :format is :pretty
# set :format, :pretty

# Default value for :log_level is :debug
# set :log_level, :debug

# Default value for :pty is false
# set :pty, true

# Default value for :linked_files is []
set :linked_files, fetch(:linked_files, []).push('.env')

# Default value for linked_dirs is []
set :linked_dirs, fetch(:linked_dirs, []).push('node_modules')

# Default value for default_env is {}
# set :default_env, { path: "/opt/ruby/bin:$PATH" }

# Default value for keep_releases is 5
# set :keep_releases, 5

set :main_js_binary, "bot.js"

set :npm_flags, '--production --no-spin --verbose' # --silent

def apt_get(*packages)
  execute :sudo, "DEBIAN_FRONTEND=noninteractive apt-get -y install #{packages.join(" ")}"
end

task :install do
  on roles(:app) do
    sudo "apt-get update"
    apt_get "node", "npm"
    execute :sudo, "npm install -g forever"
  end
end

namespace :deploy do
  task :npm_install do
    on roles(:app), except: { no_release: true } do
      execute "cd #{current_path} && npm install"
    end
  end

  task :npm_update do
    on roles(:app), except: { no_release: true } do
      execute "cd #{current_path} && npm update"
    end
  end

  task restart: :restart_resourcebot
end

after :deploy, :restart_resourcebot do
  on roles(:app), except: { no_release: true } do
    invoke 'resourcebot:restart'
  end
end

namespace :resourcebot do
  task :start do
    on roles(:app), except: { no_release: true } do
      execute "forever start --uid resourcebot --append --minUptime 1000 --spinSleepTime 1000 --workingDir #{current_path} #{current_path}/#{fetch(:main_js_binary)}"
    end
  end

  task :stop do
    on roles(:app), except: { no_release: true } do
      execute "forever stop resourcebot"
    end
  end

  task :restart do
    on roles(:app), except: { no_release: true } do
      begin
        execute "forever restart resourcebot"
      rescue => e
        puts "*** `cap resourcebot:restart` caught exeception: #{e}. Attempting `cap resourcebot:start`"
        invoke 'resourcebot:start'
      end
    end
  end

  task :status do
    on roles(:app), except: { no_release: true } do
      execute "forever list"
    end
  end
end

namespace :logs do
  task :tail do
    on roles(:app) do
      resp = capture "cd #{current_path} && node_modules/.bin/forever logs | grep #{fetch(:main_js_binary)}"
      log = resp.split(" ").last
      log.gsub!("\e[35m", "")
      log.gsub!("\e[39m", "")
      execute "tail -f #{log} | #{current_path}/node_modules/.bin/bunyan"
    end
  end
end
