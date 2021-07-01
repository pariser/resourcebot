require 'helper'
module SSHKit

  module Backend

    class TestLocal < Minitest::Test

      def setup
        super
        SSHKit.config.output = SSHKit::Formatter::BlackHole.new($stdout)
      end

      def test_upload
        Dir.mktmpdir do |dir|
          File.new("#{dir}/local", 'w')
          Local.new do
            upload!("#{dir}/local", "#{dir}/remote")
          end.run
          assert File.exist?("#{dir}/remote")
        end
      end

      def test_upload_via_pathname
        Dir.mktmpdir do |dir|
          File.new("#{dir}/local", 'w')
          Local.new do
            upload!("#{dir}/local", Pathname.new("#{dir}/remote"))
          end.run
          assert File.exist?("#{dir}/remote")
        end
      end

      def test_upload_within
        file_contents = "Some Content"
        actual_file_contents = nil
        Dir.mktmpdir do |dir|
          Local.new do
            within dir do
              execute(:mkdir, "-p", "foo")
              within "foo" do
                upload!(StringIO.new(file_contents), "bar")
              end
            end
            actual_file_contents = capture(:cat, File.join(dir, "foo", "bar"))
          end.run
          assert_equal file_contents, actual_file_contents
        end
      end

      def test_upload_recursive
        Dir.mktmpdir do |dir|
          Dir.mkdir("#{dir}/local")
          File.new("#{dir}/local/file1", 'w')
          File.new("#{dir}/local/file2", 'w')
          Local.new do
            upload!("#{dir}/local", "#{dir}/remote", recursive: true)
          end.run
          assert File.directory?("#{dir}/remote")
          assert File.exist?("#{dir}/remote/file1")
          assert File.exist?("#{dir}/remote/file2")
        end
      end

      def test_capture
        captured_command_result = ''
        Local.new do
          captured_command_result = capture(:echo, 'foo', strip: false)
        end.run
        assert_equal "foo\n", captured_command_result
      end

      def test_execute_raises_on_non_zero_exit_status_and_captures_stdout_and_stderr
        err = assert_raises SSHKit::Command::Failed do
          Local.new do
            execute :echo, "'Test capturing stderr' 1>&2; false"
          end.run
        end
        assert_equal "echo exit status: 256\necho stdout: Nothing written\necho stderr: Test capturing stderr\n", err.message
      end

      def test_test
        succeeded_test_result = failed_test_result = nil
        Local.new do
          succeeded_test_result = test('[ -d ~ ]')
          failed_test_result    = test('[ -f ~ ]')
        end.run
        assert_equal true,  succeeded_test_result
        assert_equal false, failed_test_result
      end

      def test_interaction_handler
        captured_command_result = nil
        Local.new do
          command = 'echo Enter Data; read the_data; echo Captured $the_data;'
          captured_command_result = capture(command, interaction_handler: {
            "Enter Data\n" => "SOME DATA\n",
            "Captured SOME DATA\n" => nil
          })
        end.run
        assert_equal("Enter Data\nCaptured SOME DATA", captured_command_result)
      end

      def test_interaction_handler_with_proc
        captured_command_result = nil
        Local.new do
          command = 'echo Enter Data; read the_data; echo Captured $the_data;'
          captured_command_result = capture(command, interaction_handler:
            lambda { |data|
              case data
              when "Enter Data\n"
                "SOME DATA\n"
              when "Captured SOME DATA\n"
                nil
              end
            }
          )
        end.run
        assert_equal("Enter Data\nCaptured SOME DATA", captured_command_result)
      end
    end
  end
end
