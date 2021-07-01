# -*- encoding: utf-8 -*-
# stub: capistrano 3.16.0 ruby lib

Gem::Specification.new do |s|
  s.name = "capistrano".freeze
  s.version = "3.16.0"

  s.required_rubygems_version = Gem::Requirement.new(">= 0".freeze) if s.respond_to? :required_rubygems_version=
  s.metadata = { "bug_tracker_uri" => "https://github.com/capistrano/capistrano/issues", "changelog_uri" => "https://github.com/capistrano/capistrano/releases", "documentation_uri" => "https://capistranorb.com/", "homepage_uri" => "https://capistranorb.com/", "source_code_uri" => "https://github.com/capistrano/capistrano" } if s.respond_to? :metadata=
  s.require_paths = ["lib".freeze]
  s.authors = ["Tom Clements".freeze, "Lee Hambley".freeze]
  s.date = "2021-02-28"
  s.description = "Capistrano is a utility and framework for executing commands in parallel on multiple remote machines, via SSH.".freeze
  s.email = ["seenmyfate@gmail.com".freeze, "lee.hambley@gmail.com".freeze]
  s.executables = ["cap".freeze, "capify".freeze]
  s.files = ["bin/cap".freeze, "bin/capify".freeze]
  s.homepage = "https://capistranorb.com/".freeze
  s.licenses = ["MIT".freeze]
  s.required_ruby_version = Gem::Requirement.new(">= 2.0".freeze)
  s.rubygems_version = "3.0.3".freeze
  s.summary = "Capistrano - Welcome to easy deployment with Ruby over SSH".freeze

  s.installed_by_version = "3.0.3" if s.respond_to? :installed_by_version

  if s.respond_to? :specification_version then
    s.specification_version = 4

    if Gem::Version.new(Gem::VERSION) >= Gem::Version.new('1.2.0') then
      s.add_runtime_dependency(%q<airbrussh>.freeze, [">= 1.0.0"])
      s.add_runtime_dependency(%q<i18n>.freeze, [">= 0"])
      s.add_runtime_dependency(%q<rake>.freeze, [">= 10.0.0"])
      s.add_runtime_dependency(%q<sshkit>.freeze, [">= 1.9.0"])
      s.add_development_dependency(%q<mocha>.freeze, [">= 0"])
      s.add_development_dependency(%q<rspec>.freeze, [">= 0"])
      s.add_development_dependency(%q<rubocop>.freeze, ["= 0.48.1"])
    else
      s.add_dependency(%q<airbrussh>.freeze, [">= 1.0.0"])
      s.add_dependency(%q<i18n>.freeze, [">= 0"])
      s.add_dependency(%q<rake>.freeze, [">= 10.0.0"])
      s.add_dependency(%q<sshkit>.freeze, [">= 1.9.0"])
      s.add_dependency(%q<mocha>.freeze, [">= 0"])
      s.add_dependency(%q<rspec>.freeze, [">= 0"])
      s.add_dependency(%q<rubocop>.freeze, ["= 0.48.1"])
    end
  else
    s.add_dependency(%q<airbrussh>.freeze, [">= 1.0.0"])
    s.add_dependency(%q<i18n>.freeze, [">= 0"])
    s.add_dependency(%q<rake>.freeze, [">= 10.0.0"])
    s.add_dependency(%q<sshkit>.freeze, [">= 1.9.0"])
    s.add_dependency(%q<mocha>.freeze, [">= 0"])
    s.add_dependency(%q<rspec>.freeze, [">= 0"])
    s.add_dependency(%q<rubocop>.freeze, ["= 0.48.1"])
  end
end
